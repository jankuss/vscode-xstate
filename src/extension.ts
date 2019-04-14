// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import console = require("console");
import { StateNode, Machine, interpret, assign } from "xstate";
import * as XState from "xstate";
import * as path from "path";
import * as fs from "fs";
import * as ts from "typescript";

const resource = (context: vscode.ExtensionContext, ...paths: string[]) =>
  vscode.Uri.file(path.join(context.extensionPath, ...paths));

function createVisualizerWebViewPanel(document: vscode.TextDocument) {
  return vscode.window.createWebviewPanel(
    `xstate-viz.preview`,
    TITLE,
    vscode.ViewColumn.Active,
    {
      // Enable scripts in the webview
      enableScripts: true
    }
  );
}

const TITLE = `XState Viz`;

class VisualizerPanel {
  private subscribed: boolean = false;

  private updateText() {
    if (!this.subscribed) {
      return;
    }

    // We can transpile from typescript, since TS is a superset of JS.
    const transpiled = ts.transpileModule(this.document.getText(), {});

    this.panel.webview.postMessage({
      type: "EDITOR_TEXT",
      payload: transpiled.outputText
    });
  }

  changeDocument(document: vscode.TextDocument) {
    this.document = document;
    this.updateText();
  }

  constructor(
    private context: vscode.ExtensionContext,
    private panel: vscode.WebviewPanel,
    private document: vscode.TextDocument
  ) {
    this.panel.webview.onDidReceiveMessage(message => {
      if (message.type === "SUBSCRIBED") {
        this.subscribed = true;
        this.updateText();
      }

      if (message.type === "MACHINE_ID") {
        if (message.payload.length > 0) {
          this.panel.title = `${TITLE} for ${message.payload}`;
        } else {
          this.panel.title = TITLE;
        }
      }
    });

    const filePath = resource(this.context, "bundle.js")
      .with({
        scheme: "vscode-resource"
      })
      .toString();

    const icon = resource(this.context, "icon.png").with({
      scheme: "vscode-resource"
    });

    this.panel.iconPath = {
      light: icon,
      dark: icon
    };

    this.panel.webview.html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Hello React!</title>
    </head>
    <body>
      <div id="root"></div>
  
      <!-- Main -->
      <script src="${filePath}"></script>
    </body>
  </html>
  `;

    vscode.workspace.onDidSaveTextDocument(document => {
      if (document.fileName === this.document.fileName) {
        this.document = document;
        this.updateText();
      }
    });
  }

  dispose() {
    this.panel.dispose();
  }

  reveal() {
    this.panel.reveal();
  }
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const visualizerMap = new Map<string, VisualizerPanel>();

  const getVisualizer = (document: vscode.TextDocument) =>
    visualizerMap.get(document.fileName);

  const disposeVisualizer = (document: vscode.TextDocument) => {
    const vis = visualizerMap.get(document.fileName);
    if (vis) {
      vis.dispose();
    }
    visualizerMap.delete(document.fileName);
  };

  const openVisualizer = (document: vscode.TextDocument) => {
    let vis = getVisualizer(document);
    if (!vis) {
      const panel = createVisualizerWebViewPanel(document);

      vis = new VisualizerPanel(context, panel, document);
      panel.onDidDispose(() => {
        disposeVisualizer(document);
      });

      visualizerMap.set(document.fileName, vis);
    } else {
      vis.changeDocument(document);
      vis.reveal();
    }
  };

  const disposable = vscode.commands.registerTextEditorCommand(
    "extension.helloWorld",
    editor => {
      openVisualizer(editor.document);
    }
  );

  vscode.workspace.onDidCloseTextDocument(document => {
    disposeVisualizer(document);
  });

  vscode.workspace.onDidSaveTextDocument(document => {
    const vis = getVisualizer(document);
    console.log("Saved document", !!vis);

    if (vis) {
      vis.changeDocument(document);
    }
  });

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
