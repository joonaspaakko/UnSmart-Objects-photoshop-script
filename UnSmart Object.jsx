// v.1.2.
// UnSmart Object.jsx
// https://github.com/joonaspaakko/UnSmart-Objects-photoshop-script

// #########
// Changelog
// #########

// Version 1.1. (Tested in Photoshop CC 2019)
//
// - Added a new option for removing the smart object on complete
// - Smart object size is calculated properly now, without squishing the image unnecessarily if the smartobject was clipped using a mask.
// - Any masks in the original smart object are copied over to the contents folder

// Version 1.0.
//
// - Tested in Photoshop CC 2019
// - Doesn't work with vector smart objects.
// - Though the script can keep the smart object size or at least
//   tries real hard to do it... it _doesn't_ retain any other
//   transformations, like skewing for example. It simply takes the
//   original content and resizes that to fit the bounds of the smart object
// - "ungroups" a smart object layer
// - Works with multiple Layers
//    - Ignores non-smart object layers in the active selection. So you
//      should be able to just select all layers `Cmd+Alt+A` and run the script
//      to UnSmart all smart objects in the document. Though as a word of
//      warning... it may take a long time and even make Photoshop unresponsive.
// - Option to keep layer size
// - Dialog shortcuts
//   - **Checkbox:** Keep Smart Object dimensions (toggle)
//      - Number key `1` or `Spacebar`
//   - **Checkbox:** Select Smart Objects (toggle)
//      - Number key `2`
//   - **Checkbox:** Select Smart Objects (toggle)
//      - Number key `3`
//   - **Checkbox:** Delete Smart Objects (toggle)
//      - Number key `4`
//   - **Button:** Start
//      - `Enter` key
//   - **Button:** Cancel
//      - `Esc` key
   
#target photoshop

var g = {
  bounds: {
    smartobject: null,
    contents: null
  },
  dialog: {
    ok: false,
    resizeToSO: false,
    resizeToSoLongestSize: false,
    select: [],
    deleteSO: false
  },
  selection: {
    smartObjects: [],
    smartObjectContents: []
  }
};

var script = {
  
  explodeSmartObject: function( initLayer ) {
    
    // Change ruler units to PX
    // =======================================================
    var rulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;

    // Makes activeLayer visible if it isn't.
    // =======================================================
    var activeLayer = app.activeDocument.activeLayer;
    if ( activeLayer.visible === false ) { activeLayer.visible = true; }
    
    // Smart Object layer bounds
    // =======================================================
    var initialMasks = false;
    script.ignoreMasks( function( layer, masks ) {
      g.bounds.smartobject = layer.boundsNoEffects;
      initialMasks = masks;
    });
    
    // Copy layer style
    // =======================================================
    var initLayerStyle = false;
    try {
      executeAction( charIDToTypeID( "CpFX" ), undefined, DialogModes.NO );
      initLayerStyle = true;
    } catch (e) {}
    
    // Fetch Smart Object contents...
    // =======================================================
    var regularSO = this.getSmartObject( initLayer, initLayerStyle, initialMasks );
    
    if ( regularSO ) {
      this.alignCenter( app.activeDocument.activeLayer, g.bounds.smartobject );
      
      // Confirm Action
      // =======================================================
      var so = g.bounds.smartobject;
      var co = g.bounds.contents;
      
      // Resize activeLayer
      // =======================================================
      // If user decides to use the Smart Object size
      if ( so[0]-so[2] !== co[0]-co[2] && g.dialog.resizeToSO || so[3]-so[1] !== co[3]-co[1] && g.dialog.resizeToSO ) this.resizeLayer();
      
      // Paste layer style
      // =======================================================
      if ( initLayerStyle ) {
        try {
          var idPaFX = charIDToTypeID( "PaFX" );
          var desc1134 = new ActionDescriptor();
          var idallowPasteFXOnLayerSet = stringIDToTypeID( "allowPasteFXOnLayerSet" );
          desc1134.putBoolean( idallowPasteFXOnLayerSet, true );
          executeAction( idPaFX, desc1134, DialogModes.NO );
        } catch (e) {}
      }
      
      // Add Masks
      // =======================================================
      if ( initialMasks ) {
        script.copyMasksToActiveLayerByID( activeLayer );
      }
      
      // Remove smart object after it's been unpacked
      // =======================================================
      if ( g.dialog.deleteSO ) {
        activeLayer.remove();
      }
      else {
        // Hides the Smart Object layer
        // =======================================================
        activeLayer.visible = false;
      }
      
      // Changes ruler units back to original values
      // =======================================================
      app.preferences.rulerUnits = rulerUnits;
      
    }
  
  },
  
  copyMasksToActiveLayerByID: function( activeLayer ) {
    
    // Layer mask
    try {
      var desc120 = new ActionDescriptor();
      desc120.putClass( charIDToTypeID('Nw  '), charIDToTypeID('Chnl') );
      var ref44 = new ActionReference();
      ref44.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk ') );
      ref44.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
      desc120.putReference( charIDToTypeID('At  '), ref44 );
      var ref45 = new ActionReference();
      ref45.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk ') );
      ref45.putIdentifier( charIDToTypeID( "Lyr " ), activeLayer.id );
      desc120.putReference( charIDToTypeID('Usng'), ref45 );
      desc120.putBoolean( charIDToTypeID('Dplc'), true );
      executeAction( charIDToTypeID('Mk  '), desc120, DialogModes.NO );
    } catch( e ) {}
    
    // Vector mask
    try {
      var desc173 = new ActionDescriptor();
      var ref78 = new ActionReference();
      ref78.putClass( charIDToTypeID('Path') );
      desc173.putReference( charIDToTypeID('null'), ref78 );
      var ref79 = new ActionReference();
      ref79.putEnumerated( charIDToTypeID('Path'), charIDToTypeID('Path'), stringIDToTypeID('vectorMask') );
      ref79.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
      desc173.putReference( charIDToTypeID('At  '), ref79 );
      var ref80 = new ActionReference();
      ref80.putEnumerated( charIDToTypeID('Path'), charIDToTypeID('Path'), stringIDToTypeID('vectorMask') );
      ref80.putIdentifier( charIDToTypeID( "Lyr " ), activeLayer.id );
      desc173.putReference( charIDToTypeID('Usng'), ref80 );
      desc173.putBoolean( charIDToTypeID('Dplc'), true );
      executeAction( charIDToTypeID('Mk  '), desc173, DialogModes.NO );
    } catch( e ) {}
    
  },
  
  selectAllLayers: function() {
    
    // Makes background layer a normal layer.
    // Otherwise it wouldn't be selected in the next step.
    var firstLayer = app.activeDocument.layers[ app.activeDocument.layers.length - 1 ];
    if ( firstLayer.isBackgroundLayer ) firstLayer.isBackgroundLayer = false;
    
    // Select all layers...
    var actionDescriptor = new ActionDescriptor();
    var actionReference = new ActionReference();
    actionReference.putEnumerated( charIDToTypeID( "Lyr " ), charIDToTypeID( "Ordn" ), charIDToTypeID( "Trgt" ) );
    actionDescriptor.putReference( charIDToTypeID( "null" ), actionReference );
    executeAction( stringIDToTypeID( "selectAllLayers" ), actionDescriptor, DialogModes.NO );
    
  },
  
  ignoreMasks: function( callback ) {
    
    // Duplicate
    executeAction( charIDToTypeID('CpTL'), undefined, DialogModes.NO );
    
    // Remove Vector Mask
    var vectorMask = false;
    try {
      var desc343 = new ActionDescriptor();
      var ref167 = new ActionReference();
      ref167.putEnumerated( charIDToTypeID('Path'), charIDToTypeID('Path'), stringIDToTypeID('vectorMask') );
      ref167.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
      desc343.putReference( charIDToTypeID('null'), ref167 );
      executeAction( charIDToTypeID('Dlt '), desc343, DialogModes.NO );
      vectoMask = true;
    } catch(e) {}

    // Remove Layer Mask
    var layerMask = false;
    try {
      var desc355 = new ActionDescriptor();
      var ref173 = new ActionReference();
      ref173.putEnumerated( charIDToTypeID('Chnl'), charIDToTypeID('Chnl'), charIDToTypeID('Msk ') );
      desc355.putReference( charIDToTypeID('null'), ref173 );
      executeAction( charIDToTypeID('Dlt '), desc355, DialogModes.NO );
      layerMask = true;
    } catch(e) {}
    
    var tempLayer = app.activeDocument.activeLayer;
    
    var masks = false;
    if ( vectorMask || layerMask ) masks = {};
    if ( vectorMask ) masks.vectorMask = vectoMask;
    if ( layerMask ) masks.layerMask = layerMask;
    
    callback( tempLayer, masks );
    
    tempLayer.remove();
    
  },
  
  resizeLayer: function() {
    
    var contentsWidth = g.bounds.contents[2].value - g.bounds.contents[0].value;
    var smartObjectWidth = g.bounds.smartobject[2].value - g.bounds.smartobject[0].value;
    
    var contentsHeight = g.bounds.contents[3].value - g.bounds.contents[1].value;
    var smartObjectHeight = g.bounds.smartobject[3].value - g.bounds.smartobject[1].value;
    
    
    var contents = {
      width: g.bounds.contents[2].value - g.bounds.contents[0].value,
      height: g.bounds.contents[3].value - g.bounds.contents[1].value
    };
    contents.dimensions = [contents.width, contents.height];
    
    var so = {
      width: g.bounds.smartobject[2].value - g.bounds.smartobject[0].value,
      height: g.bounds.smartobject[3].value - g.bounds.smartobject[1].value
    };
    
    var newWidth = (100 / contents.width) * so.width;
    var newHeight = (100 / contents.height) * so.height;
    
    if ( g.dialog.resizeToSoLongestSize ) {
      var newSize = (newWidth > newHeight) ? newWidth : newHeight;
      app.activeDocument.activeLayer.resize(newSize, newSize, AnchorPosition.MIDDLECENTER);
    }
    else {
      app.activeDocument.activeLayer.resize(newWidth, newHeight, AnchorPosition.MIDDLECENTER);
    }
    
    
    // Attempts to scale effects
    try {
      var desc = new ActionDescriptor();
      desc.putUnitDouble( charIDToTypeID('Scl '), charIDToTypeID('#Prc'), (newWidth>newHeight ? newWidth : newHeight)  );
      executeAction( stringIDToTypeID('scaleEffectsEvent'), desc, DialogModes.NO );
    } catch(e) {}
    
  },

  getSmartObject: function( initLayer, initLayerStyle, initialMasks ) {
    
    // Edit Smart Object contents or die trying...
    // =======================================================
    var doc = app.activeDocument;
    var soLayerName = doc.activeLayer.name;
    var soLayerName = initLayer.name;
    
    // layerColor('red');
    
    try {
      executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO );
    } catch (e) {
      // executeAction( charIDToTypeID("undo"), undefined, DialogModes.NO );
      return false; // I think I've seen enough...
    }
    
    // Select All Layers
    // =======================================================
    this.selectAllLayers();
    
    // Group Active Layers
    // =======================================================
    app.runMenuItem( stringIDToTypeID('groupLayersEvent') );

    var soDoc = app.activeDocument;
    var soDoc_active = soDoc.activeLayer;
    
    // Merge group
    // =======================================================
    executeAction( charIDToTypeID("Mrg2"), undefined, DialogModes.NO );
    
    // Active Layer Bounds
    // =======================================================
    g.bounds.contents = app.activeDocument.activeLayer.bounds;
    
    // Undo all the past mistakes...
    // =======================================================
    executeAction( charIDToTypeID("undo"), undefined, DialogModes.NO );
    
    // Duplicate group back to the main document & close SO
    // =======================================================
    var dispDlgs = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    soDoc.activeLayer.duplicate( doc.activeLayer, ElementPlacement.PLACEBEFORE );
    app.displayDialogs = dispDlgs;
    soDoc.close( SaveOptions.DONOTSAVECHANGES );
    
    app.activeDocument.activeLayer.name = soLayerName;
    
    // Ungroup if group contains one layer + no layer styles or masks in the parent smart object
    // if ( app.activeDocument.activeLayer.layers.length < 2 && !initLayerStyle && !initialMasks ) {
    //   app.runMenuItem( stringIDToTypeID('ungroupLayersEvent') );
    // }
    
    // Add active layer to array
    // =======================================================
    g.selection.smartObjectContents.push( getActiveLayerId() );
    
    return true;
    
  },
  
  alignCenter: function( activeLayer, targetBounds ) {

    var layerBounds = activeLayer.boundsNoEffects;
    
    var layer = {
      offset: {
        top: layerBounds[1].value,
        right: layerBounds[2].value,
        bottom: layerBounds[3].value,
        left: layerBounds[0].value,
      },
    };
    var target = {
      offset: {
        top: targetBounds[1].value,
        right: targetBounds[2].value,
        bottom: targetBounds[3].value,
        left: targetBounds[0].value,
      },
    };
    
    var layer_width = layer.offset.right - layer.offset.left;
    var layer_height = layer.offset.bottom - layer.offset.top;
    
    var target_width = target.offset.right - target.offset.left;
    var target_height = target.offset.bottom - target.offset.top;
    
    var translateX = target.offset.left - layer.offset.left - ( layer_width/2 ) + ( target_width/2 );
    var translateY = target.offset.top - layer.offset.top - ( layer_height/2 ) + ( target_height/2 );
    
    activeLayer.translate( translateX, translateY );
    
  },
    
  dialog: function() {

    /*
    Code for Import https://scriptui.joonas.me — (Triple click to select):
    {"activeId":31,"items":{"item-0":{"id":0,"type":"Dialog","parentId":false,"style":{"text":"UnSmart Object.jsx","preferredSize":[0,0],"margins":38,"orientation":"row","spacing":31,"alignChildren":["right","top"],"varName":null,"windowType":"Dialog","creationProps":{"su1PanelCoordinates":false,"maximizeButton":false,"minimizeButton":false,"independent":false,"closeButton":true,"borderless":false,"resizeable":false},"enabled":true}},"item-5":{"id":5,"type":"Panel","parentId":13,"style":{"text":"Options:","preferredSize":[0,0],"margins":10,"orientation":"row","spacing":2,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-6":{"id":6,"type":"Panel","parentId":31,"style":{"text":"Select:","preferredSize":[0,0],"margins":10,"orientation":"row","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-12":{"id":12,"type":"Checkbox","parentId":5,"style":{"text":"Keep Smart Object dimensions","preferredSize":[0,0],"alignment":null,"checked":false,"varName":"keepSo","helpTip":null,"enabled":true}},"item-13":{"id":13,"type":"Group","parentId":0,"style":{"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":18,"alignChildren":["fill","top"],"alignment":null,"varName":null,"enabled":true}},"item-15":{"id":15,"type":"Button","parentId":20,"style":{"text":"Start","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"ok","helpTip":null,"enabled":true}},"item-16":{"id":16,"type":"Button","parentId":20,"style":{"text":"Cancel","justify":"center","preferredSize":[0,0],"alignment":null,"varName":"cancel","helpTip":null,"enabled":true}},"item-18":{"id":18,"type":"Checkbox","parentId":22,"style":{"varName":"selectSo","text":"Smart Objects","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":true,"enabled":true}},"item-19":{"id":19,"type":"Checkbox","parentId":24,"style":{"varName":"selectCont","text":"Contents","preferredSize":[0,0],"alignment":null,"helpTip":null,"enabled":true}},"item-20":{"id":20,"type":"Group","parentId":0,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"column","spacing":10,"alignChildren":["fill","center"],"alignment":null,"enabled":true}},"item-21":{"id":21,"type":"StaticText","parentId":5,"style":{"varName":null,"text":"(?)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":"You can toggle this option with the number key: 1 or spacebar","softWrap":false,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-22":{"id":22,"type":"Group","parentId":6,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":2,"alignChildren":["left","center"],"alignment":null,"enabled":true}},"item-23":{"id":23,"type":"StaticText","parentId":22,"style":{"varName":null,"text":"(?)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":"You can toggle this option with the number key: 2","softWrap":false,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-24":{"id":24,"type":"Group","parentId":6,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":2,"alignChildren":["left","center"],"alignment":null,"enabled":true}},"item-26":{"id":26,"type":"StaticText","parentId":24,"style":{"varName":null,"text":"(?)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":"You can toggle this option with the number key: 3","softWrap":false,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-27":{"id":27,"type":"Panel","parentId":31,"style":{"text":"Delete:","preferredSize":[0,0],"margins":10,"orientation":"row","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}},"item-28":{"id":28,"type":"Group","parentId":27,"style":{"varName":null,"preferredSize":[0,0],"margins":0,"orientation":"row","spacing":2,"alignChildren":["left","center"],"alignment":null,"enabled":true}},"item-29":{"id":29,"type":"Checkbox","parentId":28,"style":{"varName":"deleteSo","text":"Smart Objects","preferredSize":[0,0],"alignment":null,"helpTip":null,"checked":false,"enabled":true}},"item-30":{"id":30,"type":"StaticText","parentId":28,"style":{"varName":null,"text":"(?)","justify":"left","preferredSize":[0,0],"alignment":null,"helpTip":"You can toggle this option with the number key: 4","softWrap":false,"creationProps":{"truncate":"none","multiline":false,"scrolling":false},"enabled":true}},"item-31":{"id":31,"type":"Panel","parentId":13,"style":{"text":"On Complete:","preferredSize":[0,0],"margins":[18,10,10,10],"orientation":"column","spacing":10,"alignChildren":["left","top"],"alignment":null,"varName":null,"creationProps":{"borderStyle":"etched","su1PanelCoordinates":false},"enabled":true}}},"order":[0,13,5,12,21,31,6,22,18,23,24,19,26,27,28,29,30,20,15,16],"settings":{"importJSON":true,"indentSize":false,"cepExport":false,"includeCSSJS":true,"showDialog":false,"functionWrapper":false,"afterEffectsDockable":false,"itemReferenceList":"None"}}
    */

    // DIALOG
    // ======
    var dialog = new Window("dialog");
        dialog.text = "UnSmart Object.jsx";
        dialog.orientation = "row";
        dialog.alignChildren = ["right","top"];
        dialog.spacing = 31;
        dialog.margins = 38;

    // GROUP1
    // ======
    var group1 = dialog.add("group", undefined, {name: "group1"});
        group1.orientation = "column";
        group1.alignChildren = ["fill","top"];
        group1.spacing = 18;
        group1.margins = 0;

    // PANEL1
    // ======
    var panel1 = group1.add("panel", undefined, undefined, {name: "panel1"});
        panel1.text = "Options:";
        panel1.orientation = "row";
        panel1.alignChildren = ["left","top"];
        panel1.spacing = 2;
        panel1.margins = 10;

    var keepSo = panel1.add("checkbox", undefined, undefined, {name: "keepSo"});
        keepSo.text = "Keep Smart Object dimensions";

    var statictext1 = panel1.add("statictext", undefined, undefined, {name: "statictext1"});
        statictext1.helpTip = "You can toggle this option with the number key: 1 or spacebar";
        statictext1.text = "(?)";

    // PANEL2
    // ======
    var panel2 = group1.add("panel", undefined, undefined, {name: "panel2"});
        panel2.text = "On Complete:";
        panel2.orientation = "column";
        panel2.alignChildren = ["left","top"];
        panel2.spacing = 10;
        panel2.margins = [10,18,10,10];

    // PANEL3
    // ======
    var panel3 = panel2.add("panel", undefined, undefined, {name: "panel3"});
        panel3.text = "Select:";
        panel3.orientation = "row";
        panel3.alignChildren = ["left","top"];
        panel3.spacing = 10;
        panel3.margins = 10;

    // GROUP2
    // ======
    var group2 = panel3.add("group", undefined, {name: "group2"});
        group2.orientation = "row";
        group2.alignChildren = ["left","center"];
        group2.spacing = 2;
        group2.margins = 0;

    var selectSo = group2.add("checkbox", undefined, undefined, {name: "selectSo"});
        selectSo.text = "Smart Objects";
        selectSo.value = true;

    var statictext2 = group2.add("statictext", undefined, undefined, {name: "statictext2"});
        statictext2.helpTip = "You can toggle this option with the number key: 2";
        statictext2.text = "(?)";

    // GROUP3
    // ======
    var group3 = panel3.add("group", undefined, {name: "group3"});
        group3.orientation = "row";
        group3.alignChildren = ["left","center"];
        group3.spacing = 2;
        group3.margins = 0;

    var selectCont = group3.add("checkbox", undefined, undefined, {name: "selectCont"});
        selectCont.text = "Contents";

    var statictext3 = group3.add("statictext", undefined, undefined, {name: "statictext3"});
        statictext3.helpTip = "You can toggle this option with the number key: 3";
        statictext3.text = "(?)";

    // PANEL4
    // ======
    var panel4 = panel2.add("panel", undefined, undefined, {name: "panel4"});
        panel4.text = "Delete:";
        panel4.orientation = "row";
        panel4.alignChildren = ["left","top"];
        panel4.spacing = 10;
        panel4.margins = 10;

    // GROUP4
    // ======
    var group4 = panel4.add("group", undefined, {name: "group4"});
        group4.orientation = "row";
        group4.alignChildren = ["left","center"];
        group4.spacing = 2;
        group4.margins = 0;

    var deleteSo = group4.add("checkbox", undefined, undefined, {name: "deleteSo"});
        deleteSo.text = "Smart Objects";

    var statictext4 = group4.add("statictext", undefined, undefined, {name: "statictext4"});
        statictext4.helpTip = "You can toggle this option with the number key: 4";
        statictext4.text = "(?)";

    // GROUP5
    // ======
    var group5 = dialog.add("group", undefined, {name: "group5"});
        group5.orientation = "column";
        group5.alignChildren = ["fill","center"];
        group5.spacing = 10;
        group5.margins = 0;

    var ok = group5.add("button", undefined, undefined, {name: "ok"});
        ok.text = "Start";

    var cancel = group5.add("button", undefined, undefined, {name: "cancel"});
        cancel.text = "Cancel";
        
        
    
    // CUSTOMIZATION
    keepSo.active = true;
    
    dialog.addEventListener("keyup", function( key ) {
      
      if ( key.keyName == 1 || key.keyName == 'Space' ) {
        keepSo.value = keepSo.value ? 0 : 1;
      }
      else if ( key.keyName == 2 ) {
        selectSo.value = selectSo.value ? 0 : 1;
        if ( selectSo.value ) deleteSo.value = selectSo.value ? 0 : 1;
      }
      else if ( key.keyName == 3 ) {
        selectCont.value = selectCont.value ? 0 : 1;
      }
      else if ( key.keyName == 4 ) {
        deleteSo.value = deleteSo.value ? 0 : 1;
        if ( deleteSo.value ) selectSo.value = deleteSo.value ? 0 : 1;
      }
      
    });
    
    selectSo.onClick = function() {
      if ( selectSo.value ) deleteSo.value = selectSo.value ? 0 : 1;
    }
    deleteSo.onClick = function() {
      if ( deleteSo.value ) selectSo.value = deleteSo.value ? 0 : 1;
    }
    
    ok.onClick = function () {
      
      g.dialog.ok = true;
      g.dialog.resizeToSO = keepSo.value;
      g.dialog.deleteSO = deleteSo.value;
      
      var checkboxes = [ selectSo, selectCont ];
      for (var i = 0; i < checkboxes.length; i++) {
        if ( checkboxes[i].value == true ) {
          g.dialog.select.push( i );
        }
        
      }
      dialog.close();
      
    }
    
    cancel.onClick = function () {
      dialog.close();
    }

    dialog.show();
  },
  
};

function progressbarDialog( length ) {
  
  var progressbar = new Window ('palette');
  
  progressbar.orientation = "row";
  progressbar.p = progressbar.add ('progressbar', undefined, 0, length );
  progressbar.p.preferredSize.width = 200;
  progressbar.text1 = progressbar.add ('statictext {text: "0", characters: 5, justify: "right"}');
  progressbar.text1.minimumSize.width = 50;
  progressbar.text2 = progressbar.add("statictext", undefined, "/");
  progressbar.text3 = progressbar.add ('statictext {text: "'+ length +'", characters: 5, justify: "left"}');
  progressbar.text3.minimumSize.width = 50;
  progressbar.show();
  
  return progressbar;
}

function layerColor( color ) {
  
  color = color.toLowerCase();
  var c;
  if ( color === 'none' ) {
    c = 'None';
  }
  else if ( color === 'red' ) {
    c = 'Rd  ';
  }
  else if ( color === 'orange' ) {
    c = 'Orng';
  }
  else if ( color === 'yellow' ) {
    c = 'Ylw ';
  }
  else if ( color === 'green' ) {
    c = 'Grn ';
  }
  else if ( color === 'blue' ) {
    c = 'Bl  ';
  }
  else if ( color === 'violet' ) {
    c = 'Vlt ';
  }
  else if ( color === 'gray' ) {
    c = 'Gry ';
  }
  
  function cTID(s) { return app.charIDToTypeID(s); };
  function sTID(s) { return app.stringIDToTypeID(s); };

  var desc939 = new ActionDescriptor();
      var ref236 = new ActionReference();
      ref236.putEnumerated( cTID('Lyr '), cTID('Ordn'), cTID('Trgt') );
  desc939.putReference( cTID('null'), ref236 );
      var desc940 = new ActionDescriptor();
      desc940.putEnumerated( cTID('Clr '), cTID('Clr '), cTID( c ) );
  desc939.putObject( cTID('T   '), cTID('Lyr '), desc940 );
  executeAction( cTID('setd'), desc939, DialogModes.NO );

}

function getActiveLayerId() {
  var ref = new ActionReference();
  ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
  desc = executeActionGet(ref);
  return desc.getInteger( charIDToTypeID('LyrI') );
}

function selectLayerByID(id, add){
  add = (add == undefined) ? add = false : add;
  var ref = new ActionReference();
  ref.putIdentifier(charIDToTypeID('Lyr '), id);
  var desc = new ActionDescriptor();
  desc.putReference(charIDToTypeID('null'), ref);
  if(add){
    desc.putEnumerated(stringIDToTypeID('selectionModifier'), stringIDToTypeID('selectionModifierType'), stringIDToTypeID('addToSelection'));
  }
  desc.putBoolean(charIDToTypeID('MkVs'), false);
  executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
}

function getSelectedLayersID( onlySmartObjects ) {
  var selectedLayersIdx = getSelectedLayersIdx();
  var selectedLayersID = new Array;
  for(var i=0;i<selectedLayersIdx.length;i++){
    var activeID = changeLayerIdxToLayerID(selectedLayersIdx[i]);
    selectLayerByID( activeID );
    if ( onlySmartObjects && app.activeDocument.activeLayer.kind == LayerKind.SMARTOBJECT ) {
      selectedLayersID.push( activeID );
    }
  }
  return selectedLayersID;
}

function getSelectedLayersIdx(){
  var selectedLayers = new Array;
  var ref = new ActionReference();
  ref.putEnumerated( charIDToTypeID('Dcmn'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
  var desc = executeActionGet(ref);
  if( desc.hasKey( stringIDToTypeID( 'targetLayers' ) ) ){
    desc = desc.getList( stringIDToTypeID( 'targetLayers' ));
    var c = desc.count
    var selectedLayersIdx = new Array();
    for(var i=0;i<c;i++){
      try{
        activeDocument.backgroundLayer;
        selectedLayersIdx.push( desc.getReference( i ).getIndex() );
      } catch(e){
        selectedLayersIdx.push( desc.getReference( i ).getIndex()+1 );
      }
    }
  }
  else {
    var ref = new ActionReference();
    ref.putProperty( charIDToTypeID('Prpr') , charIDToTypeID( 'ItmI' ));
    ref.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
    try{
      activeDocument.backgroundLayer;
      selectedLayersIdx.push( executeActionGet(ref).getInteger(charIDToTypeID( 'ItmI' ))-1);
    }catch(e){
      selectedLayersIdx.push( executeActionGet(ref).getInteger(charIDToTypeID( 'ItmI' )));
    }
  }
  return selectedLayersIdx;
};

function changeLayerIdxToLayerID(idx){
  ref = new ActionReference();
  ref.putProperty( charIDToTypeID("Prpr") , charIDToTypeID( "LyrI" ));
  ref.putIndex( charIDToTypeID( "Lyr " ), idx );
  return executeActionGet(ref).getInteger( stringIDToTypeID( "layerID" ));
}

// Only run the script if there is a document open
if ( app.documents.length > 0 ) {
  
  script.dialog();
  
  if ( g.dialog.ok ) {
    var suspendHistory = function() {
      
      var onlySmartObjects = true;
      g.selection.smartObjects = getSelectedLayersID( onlySmartObjects );
      var selection_length = g.selection.smartObjects.length;
      
        
        var progressbar = progressbarDialog( selection_length );
        for ( var i = 0; i < selection_length; i++ ) {
          
          progressbar.text1.text = i+1;
          progressbar.p.value = i+1;
          
          selectLayerByID( g.selection.smartObjects[i], false );
          script.explodeSmartObject( app.activeDocument.activeLayer );
          
        }
        
        progressbar.close();
        
        var selectLayers;
        
        if ( g.dialog.select.length === 0 ) {
                    
          // =======================================================
          var idselectNoLayers = stringIDToTypeID( "selectNoLayers" );
              var desc5 = new ActionDescriptor();
              var idnull = charIDToTypeID( "null" );
                  var ref2 = new ActionReference();
                  var idLyr = charIDToTypeID( "Lyr " );
                  var idOrdn = charIDToTypeID( "Ordn" );
                  var idTrgt = charIDToTypeID( "Trgt" );
                  ref2.putEnumerated( idLyr, idOrdn, idTrgt );
              desc5.putReference( idnull, ref2 );
          executeAction( idselectNoLayers, desc5, DialogModes.NO );
          
        }
        else {
          
          if ( g.dialog.select.length == 2 ) {
            selectLayers = g.selection.smartObjectContents.concat( g.selection.smartObjects );;
          }
          else if ( g.dialog.select[0] == 0 ) {
            selectLayers = g.selection.smartObjects;
          }
          else if ( g.dialog.select[0] == 1 ) {
            selectLayers = g.selection.smartObjectContents;
          }
          
          for (var i = 0; i < selectLayers.length; i++) {
            selectLayerByID( selectLayers[i], i === 0 ? false : true);
          }
          
        }
      
    };
    app.activeDocument.suspendHistory("UnSmart Object (script)", "suspendHistory()");
  }
  
}
