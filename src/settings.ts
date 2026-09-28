import { moment } from "obsidian";
import type { Moment } from "moment";

export interface CheckSortedSettings {
	completedAreaHierarchy: string;
	completedAreaName: string;
	showIcon: boolean;
	showStatusBar: boolean;
	autoMove: boolean;
	autocomplete: boolean;
	showDeleteButton: boolean;
	dateStamp: boolean;
	dateFormat: string;
	sortOrder: "append" | "prepend";
	sortMethod: "global" | "in-place";
}

export const DEFAULT_SETTINGS: CheckSortedSettings = {
	completedAreaHierarchy: "2",
	completedAreaName: "Completed",
	showIcon: true,
	showStatusBar: true,
	autoMove: true,
	autocomplete: true,
	showDeleteButton: true,
	dateStamp: false,
	dateFormat: "YYYY-MM-DD",
	sortOrder: "append",
	sortMethod: "global",
};

// Obsidian types its bundled moment as a namespace import, which is not callable
// when esModuleInterop is on, so give it an explicit call signature.
const now = moment as unknown as () => Moment;

/** Formats the current date/time with a Moment.js format string. */
export function formatNow(format: string): string {
	return now().format(format);
}
