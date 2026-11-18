#!/usr/bin/env node
// Static pre-TestFlight checks; no Apple account, EAS signing, or upload.
import {readFileSync} from 'node:fs';
const expo=JSON.parse(readFileSync('app.json','utf8')).expo;
const pkg=JSON.parse(readFileSync('package.json','utf8'));
const errors=[];const check=(ok,msg)=>{if(!ok)errors.push(msg)};
check(expo?.ios?.bundleIdentifier==='br.com.connexio.app','Incorrect iOS bundle ID');
check(expo?.android?.package==='br.com.connexio.app','Android source package differs; reconcile Play AAB');
check(expo?.ios?.supportsTablet===true,'iPad support not declared');
check(/^~?54\./.test(pkg.dependencies?.expo??''),'Unexpected Expo SDK; review native compatibility');
check(pkg.main==='expo-router/entry','Unexpected app entry point');
console.log('INFO: No iOS buildNumber in Expo app.json; reconcile App Store Connect before distribution');
console.log('INFO: Play AAB, login, API, privacy, Apple Team, certificates and TestFlight remain unverified');
for(const e of errors)console.error('FAIL:',e);
if(errors.length)process.exitCode=1;else console.log('PASS: static Connexio config only');
