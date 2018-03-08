'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import ContentProvider from './contentProvider'

export function activate(context: vscode.ExtensionContext) {

	this.contentProvider = new ContentProvider(context);
	this.page = null;

	let disposable = vscode.commands.registerCommand('extension.showScreencastView', () => {

		const puppeteer = require('puppeteer');
		const devices = require('puppeteer/DeviceDescriptors');
		const iPhone = devices['iPhone 6'];
		
		(async () => {

			try {
				const browser = await puppeteer.launch();
				this.page = await browser.newPage();
				await this.page.emulate(iPhone);
				await this.page.goto('http://localhost:3000');

				const client = await this.page.target().createCDPSession();
				await client.send('Page.startScreencast', {format: 'png', everyNthFrame: 1});
				await client.on('Page.screencastFrame', (image) => {
					const {sessionId, data, metadata} = image;
					client.send('Page.screencastFrameAck', {sessionId});
					this.webview.postMessage({
						type: "Page.screencastFrame",
						params: image
					})
				} );
			} catch(e) {
				console.log(e)
			}
		})();

		this.webview = vscode.window.createWebview(
			vscode.Uri.parse(`vscode-screencast:1`),
			"Screencast",
			vscode.ViewColumn.Two, {
				enableScripts: true,
				enableCommandUris: true,
			}
		);

		this.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'Page.navigate':
					this.page.goto(e.params.url);
			}
		})


		this.contentProvider.provideTextDocumentContent('').then(content => {
			this.webview.html = content;
		});		
		
	});

	context.subscriptions.push(disposable);
}
