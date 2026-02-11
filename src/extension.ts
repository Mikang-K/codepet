import * as vscode from 'vscode';

// Message type for communication between extension and webview
interface PetMessage {
	type: 'updateState';
	state?: 'Idle' | 'Coding' | 'Level-Up';
	xp?: number;
	level?: number;
}

function getLevel(xp: number): number {
	return Math.floor(xp / 100) + 1;
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

let extensionContext: vscode.ExtensionContext;
let totalXP = 0;
let pendingChars = 0;

export function activate(context: vscode.ExtensionContext) {
	extensionContext = context;
	totalXP = context.globalState.get('totalXP', 0);
	pendingChars = context.globalState.get('pendingChars', 0);
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let saveTimer: ReturnType<typeof setTimeout> | undefined;

	const provider = new PetViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('codepet.view', provider)
	);

	// Debounced save to globalState
	function saveState() {
		if (saveTimer) {
			clearTimeout(saveTimer);
		}
		saveTimer = setTimeout(() => {
			context.globalState.update('totalXP', totalXP);
			context.globalState.update('pendingChars', pendingChars);
		}, 1000);
	}

	// Track typing for XP calculation (5 XP per 100 characters)
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			const chars = event.contentChanges.reduce(
				(sum, change) => sum + change.text.length, 0
			);
			if (chars > 0) {
				pendingChars += chars;
				const earnedXP = Math.floor(pendingChars / 100) * 5;
				if (earnedXP > 0) {
					const prevLevel = getLevel(totalXP);
					totalXP += earnedXP;
					pendingChars = pendingChars % 100;

					const newLevel = getLevel(totalXP);
					if (newLevel > prevLevel) {
						provider.postMessageToWebview({
							type: 'updateState',
							state: 'Level-Up',
							xp: totalXP,
							level: newLevel,
						});
						// Revert to Coding state after level-up animation
						setTimeout(() => {
							provider.postMessageToWebview({
								type: 'updateState',
								state: 'Coding',
								xp: totalXP,
								level: getLevel(totalXP),
							});
						}, 3000);
					} else {
						provider.postMessageToWebview({
							type: 'updateState',
							state: 'Coding',
							xp: totalXP,
							level: newLevel,
						});
					}
				} else {
					provider.postMessageToWebview({
						type: 'updateState',
						state: 'Coding',
						xp: totalXP,
						level: getLevel(totalXP),
					});
				}

				saveState();

				// Switch to Idle after 30 seconds of inactivity
				if (idleTimer) {
					clearTimeout(idleTimer);
				}
				idleTimer = setTimeout(() => {
					provider.postMessageToWebview({
						type: 'updateState',
						state: 'Idle',
						xp: totalXP,
						level: getLevel(totalXP),
					});
				}, 30000);
			}
		})
	);

	provider.setInitialState(totalXP, getLevel(totalXP));
}

export function deactivate(): Thenable<void> | undefined {
	if (extensionContext) {
		return Promise.all([
			extensionContext.globalState.update('totalXP', totalXP),
			extensionContext.globalState.update('pendingChars', pendingChars),
		]).then(() => {});
	}
	return undefined;
}

export class PetViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private _initialXP = 0;
	private _initialLevel = 1;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public setInitialState(xp: number, level: number) {
		this._initialXP = xp;
		this._initialLevel = level;
		this.postMessageToWebview({
			type: 'updateState',
			state: 'Idle',
			xp: this._initialXP,
			level: this._initialLevel,
		});
	}

	public postMessageToWebview(message: PetMessage) {
		if (this._view) {
			this._view.webview.postMessage(message);
		}
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
		this.postMessageToWebview({
			type: 'updateState',
			state: 'Idle',
			xp: this._initialXP,
			level: this._initialLevel,
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const petIdleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'pet-idle.gif')
		);
		const petCodingUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'pet-coding.gif')
		);
		const nonce = getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; img-src ${webview.cspSource}; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			height: 100vh;
			margin: 0;
			font-family: var(--vscode-font-family);
			color: var(--vscode-foreground);
		}
		img {
			width: 150px;
			height: auto;
			transition: opacity 0.3s;
		}
		img.idle {
			opacity: 0.6;
		}
		img.coding {
			opacity: 1.0;
		}
		img.level-up {
			opacity: 1.0;
			animation: bounce 0.5s ease infinite;
		}
		@keyframes bounce {
			0%, 100% { transform: translateY(0); }
			50% { transform: translateY(-10px); }
		}
		.status {
			margin-top: 10px;
			font-weight: bold;
			text-align: center;
		}
		.state-label {
			margin-top: 6px;
			font-size: 12px;
			opacity: 0.8;
		}
		.xp-bar-container {
			width: 120px;
			height: 8px;
			background: var(--vscode-editorWidget-background, #333);
			border-radius: 4px;
			margin-top: 8px;
			overflow: hidden;
		}
		.xp-bar {
			height: 100%;
			width: 0%;
			background: var(--vscode-progressBar-background, #0078d4);
			border-radius: 4px;
			transition: width 0.3s ease;
		}
	</style>
</head>
<body>
	<img id="pet-img" src="${petIdleUri}" width="150" class="idle">
	<div class="status">
		Lv.<span id="level-display">1</span> &mdash; XP: <span id="xp-display">0</span>
	</div>
	<div class="xp-bar-container">
		<div id="xp-bar" class="xp-bar"></div>
	</div>
	<div id="state-label" class="state-label">Idle</div>

	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		const petImg = document.getElementById('pet-img');
		const xpDisplay = document.getElementById('xp-display');
		const levelDisplay = document.getElementById('level-display');
		const xpBar = document.getElementById('xp-bar');
		const stateLabel = document.getElementById('state-label');

		const petIdleSrc = '${petIdleUri}';
		const petCodingSrc = '${petCodingUri}';

		window.addEventListener('message', event => {
			const message = event.data;
			if (message.type === 'updateState') {
				if (xpDisplay && message.xp !== undefined) {
					xpDisplay.innerText = message.xp;
				}
				if (levelDisplay && message.level !== undefined) {
					levelDisplay.innerText = message.level;
				}
				if (xpBar && message.xp !== undefined) {
					const xpInLevel = message.xp % 100;
					xpBar.style.width = xpInLevel + '%';
				}
				if (petImg && message.state) {
					petImg.className = '';
					switch (message.state) {
						case 'Coding':
							petImg.src = petCodingSrc;
							petImg.classList.add('coding');
							if (stateLabel) { stateLabel.innerText = 'Coding...'; }
							break;
						case 'Level-Up':
							petImg.src = petCodingSrc;
							petImg.classList.add('level-up');
							if (stateLabel) { stateLabel.innerText = 'Level Up!'; }
							break;
						default:
							petImg.src = petIdleSrc;
							petImg.classList.add('idle');
							if (stateLabel) { stateLabel.innerText = 'Idle'; }
							break;
					}
				}
			}
		});
	</script>
</body>
</html>`;
	}
}
