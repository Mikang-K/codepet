import * as assert from 'assert';
import * as vscode from 'vscode';
import { PetViewProvider } from '../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('PetViewProvider can be instantiated', () => {
		const uri = vscode.Uri.file(__dirname);
		const provider = new PetViewProvider(uri);
		assert.ok(provider, 'PetViewProvider should be instantiated');
	});

	test('postMessageToWebview should not throw when view is not set', () => {
		const uri = vscode.Uri.file(__dirname);
		const provider = new PetViewProvider(uri);
		// Should handle gracefully when no webview is attached
		assert.doesNotThrow(() => {
			provider.postMessageToWebview({ type: 'updateState', xp: 0, level: 1 });
		});
	});
});
