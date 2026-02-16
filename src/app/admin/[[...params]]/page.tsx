"use client";

import { makePage } from '@keystatic/next/ui/app';
import config from '../../../../keystatic.config';

export const runtime = 'edge';

export default makePage(config);
