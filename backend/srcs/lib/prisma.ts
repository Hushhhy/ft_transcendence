/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   prisma.ts                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/18 15:53:15 by pgrellie          #+#    #+#             */
/*   Updated: 2026/03/18 17:16:55 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import { PrismaClient } from "@prisma/client"

const	globalForPrisma = globalThis as typeof globalThis & {
	__prisma?: PrismaClient
}

const	prisma = globalForPrisma.__prisma??
new		PrismaClient({
	log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
})

if (process.env.NODE_ENV !== "production")
	globalForPrisma.__prisma = prisma

export default prisma