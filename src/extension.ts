// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import console = require("console");
import { StateNode, Machine, interpret, assign } from "xstate";
import * as XState from "xstate";
import * as path from "path";
import * as fs from "fs";

function toMachine(machine: StateNode<any> | string): StateNode<any> {
  if (typeof machine !== "string") {
    return machine;
  }

  let createMachine: Function;

  try {
    createMachine = new Function(
      "Machine",
      "interpret",
      "assign",
      "XState",
      machine
    );
  } catch (e) {
    throw e;
  }

  console.log("Function", createMachine);

  let resultMachine: StateNode<any>;

  const machineProxy = (config: any, options: any, ctx: any) => {
    resultMachine = Machine(config, options, ctx);

    return resultMachine;
  };

  createMachine(machineProxy, interpret, assign, XState);

  return resultMachine! as StateNode<any>;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-xstate" is now active!');

  const disposable = vscode.commands.registerTextEditorCommand(
    "extension.helloWorld",
    editor => {
      const m = toMachine(editor.document.getText());

      const resource = (...paths: string[]) =>
        vscode.Uri.file(
          path.join(context.extensionPath, "visualizer", "build", ...paths)
        ).with({ scheme: "vscode-resource" });

      const webView = vscode.window.createWebviewPanel(
        "xstate-viz",
        "XState Visualizer",
        vscode.ViewColumn.Beside
      );

      webView.webview.html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"/><meta name="theme-color" content="#000000"/><link rel="manifest" href="${resource(
        "manifest.json"
      )}"/><title>React App</title><link href="/static/css/main.47dc36aa.chunk.css" rel="stylesheet"></head><body><noscript>You need to enable JavaScript to run this app.</noscript><div id="root"></div><script>!function(l){function e(e){for(var r,t,n=e[0],o=e[1],u=e[2],f=0,i=[];f<n.length;f++)t=n[f],p[t]&&i.push(p[t][0]),p[t]=0;for(r in o)Object.prototype.hasOwnProperty.call(o,r)&&(l[r]=o[r]);for(s&&s(e);i.length;)i.shift()();return c.push.apply(c,u||[]),a()}function a(){for(var e,r=0;r<c.length;r++){for(var t=c[r],n=!0,o=1;o<t.length;o++){var u=t[o];0!==p[u]&&(n=!1)}n&&(c.splice(r--,1),e=f(f.s=t[0]))}return e}var t={},p={1:0},c=[];function f(e){if(t[e])return t[e].exports;var r=t[e]={i:e,l:!1,exports:{}};return l[e].call(r.exports,r,r.exports,f),r.l=!0,r.exports}f.m=l,f.c=t,f.d=function(e,r,t){f.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:t})},f.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},f.t=function(r,e){if(1&e&&(r=f(r)),8&e)return r;if(4&e&&"object"==typeof r&&r&&r.__esModule)return r;var t=Object.create(null);if(f.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:r}),2&e&&"string"!=typeof r)for(var n in r)f.d(t,n,function(e){return r[e]}.bind(null,n));return t},f.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return f.d(r,"a",r),r},f.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},f.p="/";var r=window.webpackJsonp=window.webpackJsonp||[],n=r.push.bind(r);r.push=e,r=r.slice();for(var o=0;o<r.length;o++)e(r[o]);var s=n;a()}([])</script><script src="/static/js/2.6efc73d3.chunk.js"></script><script src="/static/js/main.449d311d.chunk.js"></script></body></html>`;
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
