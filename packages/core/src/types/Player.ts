import type { UUID } from 'node:crypto';

export interface Player {
    id: UUID;
    name: string;
    x: number;
    y: number;
    radius: number;
    lineWidth: number;
    color: string;
}
