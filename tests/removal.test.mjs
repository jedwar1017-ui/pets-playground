import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

// Exercise the actual UI handler with storage failures, without requiring private media.
const source=readFileSync(new URL("../playground.mjs",import.meta.url),"utf8");
const handler=source.slice(source.indexOf("async function removeClip("),source.indexOf("\nfunction setClip("));
function fixture(fail) {
 const previews=[],messages=[];
 const context=vm.createContext({
  deleteClip:async()=>{if(fail)throw Error("storage unavailable");},
  setClip:(...args)=>previews.push(args),
  say:message=>messages.push(message),
  getPet:()=>({name:"Astryx"})
 });
 vm.runInContext(handler,context);
 return {context,previews,messages};
}
test("failed removal keeps current animation and reports failure",async()=>{
 const f=fixture(true);await f.context.removeClip("astryx");
 assert.equal(f.previews.length,0);
 assert.match(f.messages[0],/Could not remove/);
});
test("successful removal changes the preview only after storage deletion",async()=>{
 const f=fixture(false);await f.context.removeClip("astryx");
 assert.deepEqual(f.previews,[["astryx",null]]);
 assert.match(f.messages[0],/placeholder/);
});
