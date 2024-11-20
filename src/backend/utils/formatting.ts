// @ts-check

import { APIResponse, APIError } from '../types/api';
import { DrillResponse } from '../types/drills';
import dayjs from 'dayjs'; // ^1.11.0
import numeral from 'numeral'; // ^2.0.6

// Human Tasks:
// 1. Monitor API response formatting performance to ensure <200ms processing time
// 2. Set up logging for formatting errors
// 3. Configure timezone settings for timestamp formatting
// 4. Verify numerical precision requirements for different score types

/**
 * @fileoverview Utility functions for consistent data formatting
 * Requirements addressed:
 * - System Performance (2. SYSTEM OVERVIEW/Success Criteria)
 * - API Design (7. SYSTEM DESIGN/7.3 API Design)
 */

/**
 * Formats a standardized API response
 * Requirement: API Design - Consistent API response formatting
 */
export function formatAPIResponse<T>(
    data: T,
    error: APIError | null = null,
    metadata: Record<string, any> = {}
): APIResponse<T> {
    const timestamp = formatTimestamp(new Date(), 'ISO');
    const requestId = crypto.randomUUID();

    return {
        success: !error,
        data,
        error: error ? {
            ...error,
            timestamp,
            requestId
        } : null,
        metadata: {
            ...metadata,
            timestamp,
            requestId
        }
    };
}

/**
 * Formats a drill-specific response
 * Requirement: API Design - Standardized response formatting
 */
export function formatDrillResponse<T>(
    data: T,
    error: string | null = null
): DrillResponse<T> {
    return {
        success: !error,
        data,
        error
    };
}

/**
 * Formats timestamps consistently
 * Supported formats: 'ISO', 'DATETIME', 'DATE', 'TIME', 'RELATIVE'
 * Requirement: System Performance - Consistent data presentation
 */
export function formatTimestamp(
    date: Date | string | number,
    format: string = 'ISO'
): string {
    try {
        const parsedDate = dayjs(date);
        
        if (!parsedDate.isValid()) {
            throw new Error('Invalid date provided');
        }

        switch (format.toUpperCase()) {
            case 'ISO':
                return parsedDate.toISOString();
            case 'DATETIME':
                return parsedDate.format('YYYY-MM-DD HH:mm:ss');
            case 'DATE':
                return parsedDate.format('YYYY-MM-DD');
            case 'TIME':
                return parsedDate.format('HH:mm:ss');
            case 'RELATIVE':
                return parsedDate.fromNow();
            default:
                return parsedDate.format(format);
        }
    } catch (error) {
        console.error('Timestamp formatting error:', error);
        return 'Invalid Date';
    }
}

/**
 * Formats numerical scores with consistent precision
 * Requirement: System Performance - Consistent data presentation
 */
export function formatScore(
    score: number,
    precision: number = 2
): string {
    try {
        if (score < 0 || score > 100) {
            throw new Error('Score must be between 0 and 100');
        }

        const format = `0.${'0'.repeat(precision)}`;
        return numeral(score).format(format) + '%';
    } catch (error) {
        console.error('Score formatting error:', error);
        return 'Invalid Score';
    }
}

/**
 * Formats time durations in human-readable format
 * Requirement: System Performance - Consistent data presentation
 */
export function formatDuration(milliseconds: number): string {
    try {
        if (milliseconds < 0) {
            throw new Error('Duration cannot be negative');
        }

        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const parts: string[] = [];

        if (days > 0) {
            parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        }
        if (hours % 24 > 0) {
            parts.push(`${hours % 24} ${hours % 24 === 1 ? 'hour' : 'hours'}`);
        }
        if (minutes % 60 > 0) {
            parts.push(`${minutes % 60} ${minutes % 60 === 1 ? 'minute' : 'minutes'}`);
        }
        if (seconds % 60 > 0 && days === 0) {
            parts.push(`${seconds % 60} ${seconds % 60 === 1 ? 'second' : 'seconds'}`);
        }

        if (parts.length === 0) {
            return 'less than a second';
        }

        if (parts.length === 1) {
            return parts[0];
        }

        const lastPart = parts.pop();
        return `${parts.join(', ')} and ${lastPart}`;
    } catch (error) {
        console.error('Duration formatting error:', error);
        return 'Invalid Duration';
    }
}