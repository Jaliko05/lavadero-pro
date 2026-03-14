import { publicClient } from './client';

export const createRating = (data) => publicClient.post('/v1/wash/ratings', data);
