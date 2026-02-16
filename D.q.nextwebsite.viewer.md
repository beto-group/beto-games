 x 

# Website Builder

```datacorejsx
const activeFile = dc.resolvePath("76 NextWebsite/D.q.nextwebsite.viewer")
const folderPath = activeFile.substring(0, activeFile.lastIndexOf('/'));

const { View } = await dc.require(folderPath + '/src/index.jsx');
return await View({ folderPath });
```
