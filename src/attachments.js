require('../module/translation-server/src/zotero');


// https://github.com/zotero/translation-server/pull/99
// for origin see: https://github.com/zotero/zotero/blob/56f9f043/chrome/content/zotero/xpcom/utilities.js#L1526-L1526

itemToAPIJSON = function(item) {
    var newItem = {
            key: Zotero.Utilities.generateObjectKey(),
            version: 0
        },
        newItems = [newItem];

    var typeID = Zotero.ItemTypes.getID(item.itemType);
    if(!typeID) {
        Zotero.debug(`itemToAPIJSON: Invalid itemType ${item.itemType}; using webpage`);
        item.itemType = "webpage";
        typeID = Zotero.ItemTypes.getID(item.itemType);
    }

    var accessDateFieldID = Zotero.ItemFields.getID('accessDate');

    var fieldID, itemFieldID;
    for(var field in item) {
        if(field === "complete" || field === "itemID" // || field === "attachments"
            || field === "seeAlso") continue;

        var val = item[field];

        if(field === "itemType") {
            newItem[field] = val;
        } else if(field === "creators") {
            // normalize creators
            var n = val.length;
            var newCreators = newItem.creators = [];
            for(var j=0; j<n; j++) {
                var creator = val[j];

                if(!creator.firstName && !creator.lastName) {
                    Zotero.debug("itemToAPIJSON: Silently dropping empty creator");
                    continue;
                }

                // Single-field mode
                if (!creator.firstName || (creator.fieldMode && creator.fieldMode == 1)) {
                    var newCreator = {
                        name: creator.lastName
                    };
                }
                // Two-field mode
                else {
                    var newCreator = {
                        firstName: creator.firstName,
                        lastName: creator.lastName
                    };
                }

                // ensure creatorType is present and valid
                if(creator.creatorType) {
                    if(Zotero.CreatorTypes.getID(creator.creatorType)) {
                        newCreator.creatorType = creator.creatorType;
                    } else {
                        Zotero.debug(`itemToAPIJSON: Invalid creator type ${creator.creatorType}; `
                            + "falling back to author");
                    }
                }
                if(!newCreator.creatorType) newCreator.creatorType = "author";

                newCreators.push(newCreator);
            }
        } else if(field === "tags") {
            // normalize tags
            var n = val.length;
            var newTags = newItem.tags = [];
            for(var j=0; j<n; j++) {
                var tag = val[j];
                if(typeof tag === "object") {
                    if(tag.tag) {
                        tag = tag.tag;
                    } else if(tag.name) {
                        tag = tag.name;
                    } else {
                        Zotero.debug("itemToAPIJSON: Discarded invalid tag");
                        continue;
                    }
                } else if(tag === "") {
                    continue;
                }
                newTags.push({"tag":tag.toString(), "type":1});
            }
        } else if(field === "notes") {
            // normalize notes
            var n = val.length;
            for(var j=0; j<n; j++) {
                var note = val[j];
                if(typeof note === "object") {
                    if(!note.note) {
                        Zotero.debug("itemToAPIJSON: Discarded invalid note");
                        continue;
                    }
                    note = note.note;
                }
                newItems.push({
                    itemType: "note",
                    parentItem: newItem.key,
                    note: note.toString()
                });
            }
        } else if((fieldID = Zotero.ItemFields.getID(field))) {
            // if content is not a string, either stringify it or delete it
            if(typeof val !== "string") {
                if(val || val === 0) {
                    val = val.toString();
                } else {
                    continue;
                }
            }

            // map from base field if possible
            if((itemFieldID = Zotero.ItemFields.getFieldIDFromTypeAndBase(typeID, fieldID))) {
                let fieldName = Zotero.ItemFields.getName(itemFieldID);
                // Only map if item field does not exist
                if(fieldName !== field && !newItem[fieldName]) newItem[fieldName] = val;
                continue;	// already know this is valid
            }

            // if field is valid for this type, set field
            if(Zotero.ItemFields.isValidForType(fieldID, typeID)) {
                // Convert access date placeholder to current time
                if (fieldID == accessDateFieldID && val == "CURRENT_TIMESTAMP") {
                    val = Zotero.Date.dateToISO(new Date());
                }

                newItem[field] = val;
            } else {
                Zotero.debug(`itemToAPIJSON: Discarded field ${field}: `
                    + `field not valid for type ${item.itemType}`, 3);
            }
		} else if(field === "attachments") {
			var n = val.length;
			for(var j=0; j<n; j++) {
				var attachment = val[j];
				if(typeof attachment !== "object" || !attachment.url) {
					Zotero.debug("itemToAPIJSON: Discarded attachment: not an URL");
					continue;
				}
				var apiItem = {
					itemType:   "attachment",
					parentItem: newItem.key,
					mimeType:   attachment.mimeType.toString(),
					url:        attachment.url.toString(),
				};
				if (attachment.title) { // Optional field member, not all attachments have a title
					apiItem['title'] = attachment.title.toString();
				}
				newItems.push(apiItem);
            }
        } else {
            Zotero.debug(`itemToAPIJSON: Discarded unknown field ${field}`, 3);
        }
    }

    return newItems;
}

module.exports = itemToAPIJSON;
