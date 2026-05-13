/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   express.d.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: pgrellie <pgrellie@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/03/31 17:22:57 by pgrellie          #+#    #+#             */
/*   Updated: 2026/03/31 18:50:36 by pgrellie         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import 'express';

declare	global {
	namespace Express {
		interface Request {
			user?: {
				id: number;
			}
			file?: {
				filename: string;
				originalname: string;
				mimetype: string;
			}
		}
	}
}

export {}