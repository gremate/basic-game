import type { UUID } from 'node:crypto';
import type { Circle } from './index.js';

export interface Player extends Circle {
    id: UUID;
    name: string;
    lineWidth: number;
    color: string;
}
