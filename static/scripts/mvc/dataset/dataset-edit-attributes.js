"use strict";define(["utils/utils","mvc/ui/ui-tabs","mvc/ui/ui-misc","mvc/form/form-view"],function(t,e,i,a){return{View:Backbone.View.extend({initialize:function(){this.setElement("<div/>"),this.model=new Backbone.Model({dataset_id:Galaxy.params.dataset_id}),this.message=new i.Message({persistent:!0}),this.tabs=this._createTabs(),this.$el.append($("<h4/>").append("Edit dataset attributes")).append(this.message.$el).append("<p/>").append(this.tabs.$el).hide(),this.render()},render:function(){var t=this;$.ajax({url:Galaxy.root+"dataset/get_edit?dataset_id="+t.model.get("dataset_id"),success:function(e){!t.initial_message&&t.message.update(e),t.initial_message=!0,_.each(t.forms,function(t,i){t.model.set("inputs",e[i+"_inputs"]),t.model.set("hide_operations",e[i+"_disable"]),t.render()}),t.$el.show()},error:function(e){var i=e.responseJSON&&e.responseJSON.err_msg;t.message.update({status:"danger",message:i||"Error occured while loading the dataset."})}})},_submit:function(t,e){var i=this,a=e.data.create();a.dataset_id=this.model.get("dataset_id"),a.operation=t,$.ajax({type:"PUT",url:Galaxy.root+"dataset/set_edit",data:a,success:function(t){i.message.update(t),i.render(),i._reloadHistory()},error:function(t){var e=t.responseJSON&&t.responseJSON.err_msg;i.message.update({status:"danger",message:e||"Error occured while editing the dataset attributes."})}})},_createTabs:function(){this.forms={attribute:this._getAttribute(),conversion:this._getConversion(),datatype:this._getDatatype(),permission:this._getPermission()};var t=new e.View;return t.add({id:"attribute",title:"Attributes",icon:"fa fa-bars",tooltip:"Edit dataset attributes",$el:this.forms.attribute.$el}),t.add({id:"convert",title:"Convert",icon:"fa-gear",tooltip:"Convert to new format",$el:this.forms.conversion.$el}),t.add({id:"datatype",title:"Datatypes",icon:"fa-database",tooltip:"Change data type",$el:this.forms.datatype.$el}),t.add({id:"permissions",title:"Permissions",icon:"fa-user",tooltip:"Permissions",$el:this.forms.permission.$el}),t},_getAttribute:function(){var t=this,e=new a({title:"Edit attributes",operations:{submit_attributes:new i.ButtonIcon({tooltip:"Save attributes of the dataset.",icon:"fa-floppy-o",title:"Save",onclick:function(){t._submit("attributes",e)}}),submit_autodetect:new i.ButtonIcon({tooltip:"This will inspect the dataset and attempt to correct the values of fields if they are not accurate.",icon:"fa-undo",title:"Auto-detect",onclick:function(){t._submit("autodetect",e)}})}});return e},_getConversion:function(){var t=this,e=new a({title:"Convert to new format",operations:{submit_conversion:new i.ButtonIcon({tooltip:"Convert the datatype to a new format.",title:"Convert datatype",icon:"fa-exchange",onclick:function(){t._submit("conversion",e)}})}});return e},_getDatatype:function(){var t=this,e=new a({title:"Change datatype",operations:{submit_datatype:new i.ButtonIcon({tooltip:"Change the datatype to a new type.",title:"Change datatype",icon:"fa-exchange",onclick:function(){t._submit("datatype",e)}})}});return e},_getPermission:function(){var t=this,e=new a({title:"Manage dataset permissions",operations:{submit_permission:new i.ButtonIcon({tooltip:"Save permissions.",title:"Save permissions",icon:"fa-floppy-o ",onclick:function(){t._submit("permission",e)}})}});return e},_reloadHistory:function(){window.Galaxy&&window.Galaxy.currHistoryPanel.loadCurrentHistory()}})}});
//# sourceMappingURL=../../../maps/mvc/dataset/dataset-edit-attributes.js.map
