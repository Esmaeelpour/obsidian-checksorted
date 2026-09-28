import { App, moment, PluginSettingTab, Setting, SettingDefinitionItem } from "obsidian";
import type CheckSortedPlugin from "./main";
import { CheckSortedSettings, DEFAULT_SETTINGS } from "./settings";

type SettingKey = keyof CheckSortedSettings;

export class CheckSortedSettingTab extends PluginSettingTab {
	plugin: CheckSortedPlugin;
	private activeTab = "general";

	constructor(app: App, plugin: CheckSortedPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// Obsidian 1.13+: settings are rendered declaratively from these definitions.
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
								desc: `Moment.js format string. Preview: ${moment().format(this.plugin.settings.dateFormat)}`,
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
		// Empty text fields fall back to their defaults, as in the legacy UI.
		if ((key === "completedAreaName" || key === "dateFormat") && !value) {
			value = DEFAULT_SETTINGS[key];
		}
		settings[key] = value;
		await this.plugin.saveSettings();

		if (key === "showIcon") this.plugin.updateRibbonIcon();
		else if (key === "showStatusBar") this.plugin.updateStatusBar();
		else if (key === "autoMove") this.plugin.refreshStatusBar();
		else if (key === "showDeleteButton") this.app.workspace.updateOptions();
		else if (key === "sortMethod" || key === "dateStamp") this.refreshDomState();
	}

	// Fallback for Obsidian versions older than 1.13, which don't support getSettingDefinitions().
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Tab bar
		const tabBar = containerEl.createDiv("checksorted-tab-bar");
		const tabs: { id: string; label: string }[] = [
			{ id: "general", label: "General" },
			{ id: "interface", label: "Interface" },
			{ id: "behavior", label: "Behavior" },
		];

		const contentEl = containerEl.createDiv("checksorted-tab-content");

		tabs.forEach(({ id, label }) => {
			const btn = tabBar.createEl("button", {
				text: label,
				cls: "checksorted-tab-btn" + (this.activeTab === id ? " is-active" : ""),
			});
			btn.addEventListener("click", () => {
				this.activeTab = id;
				this.display();
			});
		});

		if (this.activeTab === "general") this.renderGeneral(contentEl);
		else if (this.activeTab === "interface") this.renderInterface(contentEl);
		else if (this.activeTab === "behavior") this.renderBehavior(contentEl);
	}

	private section(containerEl: HTMLElement, title: string, open = true): HTMLElement {
		const details = containerEl.createEl("details", { cls: "checksorted-section" });
		if (open) details.setAttribute("open", "");
		details.createEl("summary", { text: title, cls: "checksorted-section-title" });
		return details;
	}

	private renderGeneral(el: HTMLElement): void {
		const areaSection = this.section(el, "Sorting & Completed Area");

		new Setting(areaSection)
			.setName("Sort method")
			.setDesc("Choose how completed items are sorted.")
			.addDropdown((drop) =>
				drop
					.addOptions({ "global": "Global completed area", "in-place": "In-place list sorting" })
					.setValue(this.plugin.settings.sortMethod)
					.onChange(async (value: "global" | "in-place") => {
						this.plugin.settings.sortMethod = value;
						await this.plugin.saveSettings();
						this.display(); // Re-render to show/hide relevant settings
					})
			);

		if (this.plugin.settings.sortMethod === "global") {
			new Setting(areaSection)
				.setName("Header level")
				.setDesc("Heading level for the completed area (H1–H6).")
				.addDropdown((drop) =>
					drop
						.addOptions({ "1": "H1", "2": "H2", "3": "H3", "4": "H4", "5": "H5", "6": "H6" })
						.setValue(this.plugin.settings.completedAreaHierarchy)
						.onChange(async (value) => {
							this.plugin.settings.completedAreaHierarchy = value;
							await this.plugin.saveSettings();
						})
				);

			new Setting(areaSection)
				.setName("Header name")
				.setDesc("Text of the completed area heading.")
				.addText((text) =>
					text
						.setPlaceholder("Completed")
						.setValue(this.plugin.settings.completedAreaName)
						.onChange(async (value) => {
							this.plugin.settings.completedAreaName = value || "Completed";
							await this.plugin.saveSettings();
						})
				);

			new Setting(areaSection)
				.setName("New items order")
				.setDesc("Where to place newly moved items within the completed area.")
				.addDropdown((drop) =>
					drop
						.addOptions({ append: "Append (bottom)", prepend: "Prepend (top)" })
						.setValue(this.plugin.settings.sortOrder)
						.onChange(async (value: "append" | "prepend") => {
							this.plugin.settings.sortOrder = value;
							await this.plugin.saveSettings();
						})
				);
		}

		const dateSection = this.section(el, "Date Stamp");

		new Setting(dateSection)
			.setName("Date stamp")
			.setDesc("Append a completion date when items are moved.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.dateStamp)
					.onChange(async (value) => {
						this.plugin.settings.dateStamp = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.dateStamp) {
			new Setting(dateSection)
				.setName("Date format")
				.setDesc(
					`Moment.js format string. Preview: ${moment().format(
						this.plugin.settings.dateFormat
					)}`
				)
				.addText((text) =>
					text
						.setPlaceholder("YYYY-MM-DD")
						.setValue(this.plugin.settings.dateFormat)
						.onChange(async (value) => {
							this.plugin.settings.dateFormat = value || "YYYY-MM-DD";
							await this.plugin.saveSettings();
						})
				);
		}
	}

	private renderInterface(el: HTMLElement): void {
		const sidebarSection = this.section(el, "Sidebar & Status Bar");

		new Setting(sidebarSection)
			.setName("Show ribbon icon")
			.setDesc("Show the move-completed icon in the left sidebar.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showIcon)
					.onChange(async (value) => {
						this.plugin.settings.showIcon = value;
						await this.plugin.saveSettings();
						this.plugin.updateRibbonIcon();
					})
			);

		new Setting(sidebarSection)
			.setName("Show status bar toggle")
			.setDesc(
				"Show a button in the bottom status bar that toggles auto-move on/off and displays its current state."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBar = value;
						await this.plugin.saveSettings();
						this.plugin.updateStatusBar();
					})
			);

		const editorSection = this.section(el, "Editor");

		new Setting(editorSection)
			.setName("Show delete button")
			.setDesc(
				"Show a × on the right of each checkbox line in the editor; click it to delete that task."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showDeleteButton)
					.onChange(async (value) => {
						this.plugin.settings.showDeleteButton = value;
						await this.plugin.saveSettings();
						this.app.workspace.updateOptions();
					})
			);

		new Setting(editorSection)
			.setName("Task autocomplete")
			.setDesc(
				"While typing in a checkbox, suggest matching tasks from elsewhere in the note. Selecting one moves that task to the line you are typing."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autocomplete)
					.onChange(async (value) => {
						this.plugin.settings.autocomplete = value;
						await this.plugin.saveSettings();
					})
			);
	}

	private renderBehavior(el: HTMLElement): void {
		const autoSection = this.section(el, "Automation");

		new Setting(autoSection)
			.setName("Auto-move on complete")
			.setDesc(
				"Automatically move items to the completed area when a checkbox is checked."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoMove)
					.onChange(async (value) => {
						this.plugin.settings.autoMove = value;
						await this.plugin.saveSettings();
						this.plugin.refreshStatusBar();
					})
			);
	}
}
