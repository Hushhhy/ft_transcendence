import type { BJTable, PlayerSeat } from './types';

const DEFAULT_MAX_PLAYERS = 5;
const PREFERRED_SEAT_ORDER = [2, 1, 3, 0, 4];

const tables = new Map<string, BJTable>();
const socketToTable = new Map<string, string>();

function isTableEmpty(table: BJTable): boolean {
  return table.players.length === 0 && table.pendingPlayers.length === 0;
}

export function cleanupEmptyTables(): number {
  let removed = 0;

  for (const [tableId, table] of tables.entries()) {
    if (!isTableEmpty(table)) {
      continue;
    }

    tables.delete(tableId);
    removed += 1;
  }

  return removed;
}

function createSeat(userId: number, socketId: string, username: string, seatIndex: number, avatarUrl?: string | null): PlayerSeat {
  return {
    userId,
    socketId,
    username,
    avatarUrl: avatarUrl || null,
    seatIndex,
    bet: 0,
    hand: [],
    stood: false,
    busted: false,
    blackjack: false,
    done: false,
  };
}

function createTable(id: string): BJTable {
  return {
    id,
    players: [],
    pendingPlayers: [],
    maxPlayers: DEFAULT_MAX_PLAYERS,
    state: 'waiting',
    deck: [],
    dealerHand: [],
    currentTurnSeatIndex: null,
    roundNumber: 0,
  };
}

function updateTurnAfterLeave(table: BJTable, removedSeatIndex: number | null): void {
  if (table.state !== 'playing' || removedSeatIndex === null) {
    return;
  }

  if (table.currentTurnSeatIndex !== removedSeatIndex) {
    return;
  }

  const orderedPlayers = [...table.players]
    .filter((seat) => !seat.done && !seat.busted)
    .sort((left, right) => right.seatIndex - left.seatIndex);

  const nextSeat = orderedPlayers.find((seat) => seat.seatIndex < removedSeatIndex) || orderedPlayers[0] || null;
  table.currentTurnSeatIndex = nextSeat ? nextSeat.seatIndex : null;
}

export function getTableById(tableId: string): BJTable | null {
  return tables.get(tableId) || null;
}

export function getTableBySocket(socketId: string): BJTable | null {
  const tableId = socketToTable.get(socketId);
  if (!tableId) {
    return null;
  }

  return getTableById(tableId);
}

export function promotePendingPlayers(table: BJTable): number {
  if (table.state !== 'waiting' || table.pendingPlayers.length === 0) {
    return 0;
  }

  const availableSlots = table.maxPlayers - table.players.length;
  if (availableSlots <= 0) {
    return 0;
  }

  const promoted = table.pendingPlayers.slice(0, availableSlots);
  table.players.push(...promoted);
  table.pendingPlayers = table.pendingPlayers.slice(availableSlots);
  return promoted.length;
}

function pickJoinTable(): BJTable {
  for (const table of tables.values()) {
    if (table.state === 'waiting' && table.players.length + table.pendingPlayers.length < table.maxPlayers) {
      return table;
    }
  }

  for (const table of tables.values()) {
    if (table.players.length + table.pendingPlayers.length < table.maxPlayers) {
      return table;
    }
  }

  const id = `bj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const newTable = createTable(id);
  tables.set(id, newTable);
  return newTable;
}

export function joinTable(socketId: string, userId: number, username: string, avatarUrl?: string | null): {
  table: BJTable;
  seat: PlayerSeat;
  joinedAsPending: boolean;
} {
  cleanupEmptyTables();

  const table = pickJoinTable();
  const usedSeats = new Set([...table.players, ...table.pendingPlayers].map((seat) => seat.seatIndex));

  let seatIndex = PREFERRED_SEAT_ORDER.find((index) => !usedSeats.has(index)) ?? -1;
  if (seatIndex < 0) {
    seatIndex = 0;
    while (usedSeats.has(seatIndex)) {
      seatIndex += 1;
    }
  }

  const seat = createSeat(userId, socketId, username, seatIndex, avatarUrl);
  const joinedAsPending = table.state === 'playing';

  if (joinedAsPending) {
    table.pendingPlayers.push(seat);
  } else {
    table.players.push(seat);
  }

  socketToTable.set(socketId, table.id);
  return { table, seat, joinedAsPending };
}

export function leaveTable(socketId: string): BJTable | null {
  cleanupEmptyTables();

  const tableId = socketToTable.get(socketId);
  if (!tableId) {
    return null;
  }

  const table = tables.get(tableId);
  if (!table) {
    socketToTable.delete(socketId);
    return null;
  }

  const leavingSeat = table.players.find((seat) => seat.socketId === socketId) || null;
  const leavingSeatIndex = leavingSeat ? leavingSeat.seatIndex : null;

  table.players = table.players.filter((seat) => seat.socketId !== socketId);
  table.pendingPlayers = table.pendingPlayers.filter((seat) => seat.socketId !== socketId);
  updateTurnAfterLeave(table, leavingSeatIndex);
  socketToTable.delete(socketId);

  if (isTableEmpty(table)) {
    tables.delete(tableId);
    return null;
  }

  cleanupEmptyTables();

  return table;
}

export function getSeatBySocket(table: BJTable, socketId: string): PlayerSeat | null {
  return table.players.find((seat) => seat.socketId === socketId) || null;
}
