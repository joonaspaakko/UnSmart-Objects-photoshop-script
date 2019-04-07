
![](readme_images/script-dialog.png)

## Dialog shortcuts

- **Checkbox:** Keep Smart Object dimensions (toggle)
   - Number key `1` or `Spacebar`
- **Checkbox:** Smart Objects (toggle)
   - Number key `2`
- **Checkbox:** Smart Objects (toggle)
   - Number key `3`
- **Button:** Start
   - `Enter` key
- **Button:** Cancel
   - `Esc` key

## What can it do?

- "ungroups" a smart object layer
- Works with multiple Layers
   - Ignores non-smart object layers in the active selection. So you should be able to just select all layers `Cmd+Alt+A` and run the script to UnSmart all smart objects in the document. Though as a word of warning... it may take a long time and even make Photoshop unresponsive.
- Option to keep layer size

## Example

A small example where the script un-smarts multiple layers and keeps the smart object size for each.

![](readme_images/multi-image+keep-size-example.gif)

## Good to know

- Tested in Photoshop CC 2019
- Doesn't work with vector smart objects.
- Though the script can keep the smart object size or at least tries real hard to do it... it _doesn't_ retain any other transformations, like skewing for example. It simply takes the original content and resizes that to fit the bounds of the smart object.
