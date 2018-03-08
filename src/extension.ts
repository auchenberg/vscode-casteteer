'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import ContentProvider from './contentProvider'

export function activate(context: vscode.ExtensionContext) {

	this.contentProvider = new ContentProvider(context);
	this.page = null;
	this.client = null;

	let disposable = vscode.commands.registerCommand('extension.showScreencastView', () => {

		const puppeteer = require('puppeteer');
		const devices = require('puppeteer/DeviceDescriptors');
		const iPhone = devices['iPhone 6'];
		
		(async () => {

			try {
				const browser = await puppeteer.launch({
					args: [
					  '--remote-debugging-port=9222'
					]
				  })
				this.page = await browser.newPage();
				await this.page.emulate(iPhone);
				await this.page.goto('http://localhost:3000');

				this.client = await this.page.target().createCDPSession();

				await this.client.send('Emulation.setTouchEmulationEnabled', {
					enabled: true,
					maxTouchPoints: 1
				});

				await this.client.send('Emulation.setEmitTouchEventsForMouse', {
					enabled: true,
					configuration: 'mobile'
				});

				await this.client.send('Page.startScreencast', {format: 'jpeg'});

				await this.client.on('Page.screencastFrame', (image) => {
					const {sessionId, data, metadata} = image;
					this.client.send('Page.screencastFrameAck', {sessionId});
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
				enableCommandUris: true
			}
		);

		this.webview.onDidReceiveMessage(e => {
			switch (e.type) {
				case 'Page.navigate':
					this.page.goto(e.params.url);
					break;
				case 'Input.emulateTouchFromMouseEvent':
					this.client.send('Input.emulateTouchFromMouseEvent', e.params);
					break;
				case 'Input.dispatchKeyEvent':
					this.client.send('Input.dispatchKeyEvent', e.params);
					break;
			}
		})

		this.contentProvider.provideTextDocumentContent('').then(content => {
			this.webview.html = content;
		});		
		
	});

	context.subscriptions.push(disposable);
}
