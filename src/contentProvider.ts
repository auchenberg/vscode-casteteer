'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

export default class ContentProvider implements vscode.TextDocumentContentProvider {

    constructor(
		private readonly context: vscode.ExtensionContext
    ) { }
    
    private extensionResourcePath(mediaFile: string): string {
        return vscode.Uri.file(this.context.asAbsolutePath(path.join('assets', mediaFile)))
            .with({ scheme: 'vscode-extension-resource' })
            .toString();
    }

    public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
        return `<body>
            <head>
                <link rel="stylesheet" type="text/css" href="${this.extensionResourcePath('screencast.css')}">
            </head>
            <div class="screencast">    
                <nav>
                    <input type=text" value="http://localhost:3000" />
                    <button>Go</button>
                </nav>                
                <div class="frame-box">        
                    <div class="frame">
                        <div class="device">    
                            <img src="${this.extensionResourcePath('iphone.png')}" />
                            <div class="screen">    
                                <canvas tabindex="0"></canvas>
                            </div>                            
                        </div>
                    </div>
                </div>
            </div>

            <script src="${this.extensionResourcePath('screencast.js')}" />
        </body>`;
    }
}
