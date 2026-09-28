import { App, PluginSettingTab, SettingDefinitionItem } from "obsidian";
import type CheckSortedPlugin from "./main";
import { CheckSortedSettings, DEFAULT_SETTINGS, formatNow } from "./settings";

type SettingKey = keyof CheckSortedSettings;

export class CheckSortedSettingTab extends PluginSettingTab {
	plugin: CheckSortedPlugin;

	constructor(app: App, plugin: CheckSortedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
		const isGlobal = () => this.plugin.settings.sortMethod === "global";
		const hasDateStamp = () => this.plugin.settings.dateStamp;

		return [
			{
				type: "page",
				name: "General",
				items: [
					{
						type: "group",
						heading: "Sorting & Completed Area",
						items: [
							{
								name: "Sort method",
								desc: "Choose how completed items are sorted.",
								control: {
									type: "dropdown",
									key: "sortMethod",
									options: { "global": "Global completed area", "in-place": "In-place list sorting" },
								},
							},
							{
								name: "Header level",
								desc: "Heading level for the completed area (H1–H6).",
								visible: isGlobal,
								control: {
									type: "dropdown",
									key: "completedAreaHierarchy",
									options: { "1": "H1", "2": "H2", "3": "H3", "4": "H4", "5": "H5", "6": "H6" },
								},
							},
							{
								name: "Header name",
								desc: "Text of the completed area heading.",
								visible: isGlobal,
								control: { type: "text", key: "completedAreaName", placeholder: "Completed" },
							},
							{
								name: "New items order",
								desc: "Where to place newly moved items within the completed area.",
								visible: isGlobal,
								control: {
									type: "dropdown",
									key: "sortOrder",
									options: { append: "Append (bottom)", prepend: "Prepend (top)" },
								},
							},
							{
								name: "Keep sub-tasks with their parent",
								desc: "Move a task together with its sub-tasks and indented notes. Checking a parent completes and moves its sub-tasks too; unchecking it brings them all back. When off, each checked line moves on its own.",
								visible: isGlobal,
								control: { type: "toggle", key: "keepSubtasks" },
							},
						],
					},
					{
						type: "group",
						heading: "Date Stamp",
						items: [
							{
								name: "Date stamp",
								desc: "Append a completion date when items are moved.",
								control: { type: "toggle", key: "dateStamp" },
							},
							{
								name: "Date format",
								desc: `Moment.js format string. Preview: ${formatNow(this.plugin.settings.dateFormat)}`,
								visible: hasDateStamp,
								control: { type: "text", key: "dateFormat", placeholder: "YYYY-MM-DD" },
							},
						],
					},
				],
			},
			{
				type: "page",
				name: "Interface",
				items: [
					{
						type: "group",
						heading: "Sidebar & Status Bar",
						items: [
							{
								name: "Show ribbon icon",
								desc: "Show the move-completed icon in the left sidebar.",
								control: { type: "toggle", key: "showIcon" },
							},
							{
								name: "Show status bar toggle",
								desc: "Show a button in the bottom status bar that toggles auto-move on/off and displays its current state.",
								control: { type: "toggle", key: "showStatusBar" },
							},
						],
					},
					{
						type: "group",
						heading: "Editor",
						items: [
							{
								name: "Show delete button",
								desc: "Show a × on the right of each checkbox line in the editor; click it to delete that task.",
								control: { type: "toggle", key: "showDeleteButton" },
							},
							{
								name: "Show delete button on touch screens",
								desc: "Touch screens have no hover, so keep the × visible on phones and tablets.",
								visible: () => this.plugin.settings.showDeleteButton,
								control: { type: "toggle", key: "touchDeleteButton" },
							},
							{
								name: "Task autocomplete",
								desc: "While typing in a checkbox, suggest matching tasks from elsewhere in the note. Selecting one moves that task to the line you are typing.",
								control: { type: "toggle", key: "autocomplete" },
							},
						],
					},
				],
			},
			{
				type: "page",
				name: "Behavior",
				items: [
					{
						type: "group",
						heading: "Automation",
						items: [
							{
								name: "Auto-move on complete",
								desc: "Automatically move items to the completed area when a checkbox is checked.",
								control: { type: "toggle", key: "autoMove" },
							},
							{
								name: "Auto-move in Reading view",
								desc: "Also move items when a checkbox is ticked in Reading view.",
								visible: () => this.plugin.settings.autoMove,
								control: { type: "toggle", key: "readingViewAutoMove" },
							},
						],
					},
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as SettingKey];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const settings = this.plugin.settings as unknown as Record<string, unknown>;
		// Empty text fields fall back to their defaults.
		if ((key === "completedAreaName" || key === "dateFormat") && !value) {
			value = DEFAULT_SETTINGS[key];
		}
		settings[key] = value;
		await this.plugin.saveSettings();

		if (key === "showIcon") this.plugin.updateRibbonIcon();
		else if (key === "showStatusBar") this.plugin.updateStatusBar();
		else if (key === "autoMove") this.plugin.refreshStatusBar();
		else if (key === "showDeleteButton" || key === "touchDeleteButton") this.app.workspace.updateOptions();

		// Settings that show or hide other settings.
		if (["sortMethod", "dateStamp", "autoMove", "showDeleteButton"].includes(key)) this.refreshDomState();
	}
}
