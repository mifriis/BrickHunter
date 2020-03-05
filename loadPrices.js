var SATERROR = 0;

function loadPrices() {
    $("#dialogProgress").dialog({
        dialogClass: "no-close",
        modal: true,
        closeOnEscape: false,
        draggable: false,
        resizable: false
    });

    startLoadPrice();
}

function startLoadPrice() {
    initDisplayList();

    var i = 0;
    const myInterval = setInterval(function () {
        if (!loadPrice(i++)) {
            clearInterval(myInterval);
            SATERROR = 0;
        }
        if (i === $(ITEMS).length) {
            clearInterval(myInterval);
            afterLoadPrice();
        }
    }, 1);
}

function afterLoadPrice() {
    SATERROR = 0;
    drawTable();
    $("#dialogProgress").dialog("close");
}

function loadPrice(index) {
    $("#dialogProgress").html(`${index}/${ITEMS.length}`);
    var item = ITEMS[index];
    var satBricks = loadSteineAndTeile(item.designId);
    if (SATERROR == 440) {
        $("#dialogSteineTeile").dialog({
            modal: true,
            closeOnEscape: false,
            draggable: false,
            resizable: false
        });
        return false;
    } else {
        var foundSatBrick = $(satBricks).filter(function (index) {
            return satBricks[index].ColourDescr.replace(/ /g, "").toUpperCase() == item.color.piecesAndBricksName.replace(/ /g, "").toUpperCase();
        })[0];

        if (typeof foundSatBrick != 'undefined') {
            if (typeof foundSatBrick.PriceStr != 'undefined') {
                item.sapPrice = foundSatBrick.Price;
            }
            /*if (typeof foundSatBrick.Asset != 'undefined') {
                item.image = foundSatBrick.Asset;
            }
            if (typeof foundSatBrick.ItemDescr != 'undefined') {
                item.itemDescr = foundSatBrick.ItemDescr;
            }
            if (satCurrency == '') {
                if (typeof foundSatBrick.CId != 'undefined') {
                    satCurrency = foundSatBrick.CId;
                    $("#satTitle").text('S&T (' + satCurrency + ')');
                }
            }*/
        }
        if (item.sapPrice <= 0) {
            item.alternateNo = loadBrickLinkAlternativeNumbers(item.itemId)?.replace(/ /g, "").split(",");

            $(item.alternateNo).each(function (index) {
                item.designId = item.alternateNo[index];
                satBricks = loadSteineAndTeile(item.designId);
                var foundSatBrick = $(satBricks).filter(function (index) {
                    return satBricks[index].ColourDescr.replace(/ /g, "").toUpperCase() == item.color.piecesAndBricksName.replace(/ /g, "").toUpperCase();
                })[0];
                if (typeof foundSatBrick != 'undefined') {
                    if (typeof foundSatBrick.PriceStr != 'undefined') {
                        item.sapPrice = foundSatBrick.Price;
                        return true;
                    }
                }
            });
        }

        if (item.sapPrice <= 0) {
            item.designId = 'N/A'
            item.sapPrice = 'N/A'
        }

        var pabBricks = loadPickABrick(item.designId);

        var foundPabBrick = $(pabBricks).filter(function (index) {
            return pabBricks[index].variant.attributes.colour.toUpperCase() == item.color.pickABrickName.toUpperCase();
        })[0];

        if (typeof foundPabBrick != 'undefined') {
            if (typeof foundPabBrick.variant != 'undefined') {
                if (typeof foundPabBrick.variant.price != 'undefined') {
                    if (typeof foundPabBrick.variant.price.centAmount != 'undefined') {
                        item.pabPrice = foundPabBrick.variant.price.centAmount / 100
                    }
                    /*if (pabCurrency == '') {
                        if (typeof foundPabBrick.variant.price.currencyCode != 'undefined') {
                            pabCurrency = foundPabBrick.variant.price.currencyCode;
                            $("#pabTitle").text('PaB (' + pabCurrency + ')');
                        }
                    }*/
                }
            }
        }

        if (item.pabPrice <= 0) {
            item.pabPrice = 'N/A'
        }

        addBrickToDisplayList(
            item.itemId,
            item.designId,
            item.color.brickLinkId,
            item.color.brickLinkName,
            item.color.legoName,
            item.color.colorCode,
            item.quantity,
            item.maxPrice,
            item.pabPrice,
            item.sapPrice
        );
    }
    return true;
}




function loadSteineAndTeile(itemNo) {
    var result;
    if (SATERROR > 0) {
        return;
    }

    $.ajax({
        type: "GET",
        url: `https://www.lego.com/en-US/service/rpservice/getitemordesign?itemordesignnumber=${itemNo}&isSalesFlow=true`,
        //xhrFields: { withCredentials: false },
        //crossDomain: true,
        async: false,
        //headers: { "cookie": "csAgeAndCountry={\"age\":\"31\",\"countrycode\":\"CH\"};"},
        success: function (data) {
            result = data.Bricks;
        },
        error: function (result) {
            SATERROR = result.status;
        }
    });

    return result;
}

function loadPickABrick(itemNo) {
    var result;

    var PickABrickQuery = {
        operationName: "PickABrickQuery",
        variables: {
            page: 1,
            perPage: 20,
            query: itemNo
        },
        query: "query PickABrickQuery($query: String, $page: Int, $perPage: Int, $filters: [Filter!]) {\n  elements(query: $query, page: $page, perPage: $perPage, filters: $filters) {\n    count\n    facets {\n      ...FacetData\n      __typename\n    }\n    results {\n      ...ElementLeafData\n      __typename\n    }\n    total\n    __typename\n  }\n  me {\n    ... on LegoUser {\n      ...UserData\n      pabCart {\n        PABLineItems {\n          ...PABLineItemData\n          __typename\n        }\n        taxedPrice {\n          totalGross {\n            currencyCode\n            formattedAmount\n            formattedValue\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment FacetData on Facet {\n  id\n  key\n  name\n  labels {\n    count\n    key\n    name\n    ... on FacetValue {\n      value\n      __typename\n    }\n    ... on FacetRange {\n      from\n      to\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ElementLeafData on Element {\n  id\n  name\n  primaryImageUrl\n  spinset {\n    frames {\n      url\n      __typename\n    }\n    __typename\n  }\n  ... on SingleVariantElement {\n    variant {\n      ...ElementLeafVariant\n      __typename\n    }\n    __typename\n  }\n  ... on MultiVariantElement {\n    variants {\n      ...ElementLeafVariant\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment ElementLeafVariant on ElementVariant {\n  id\n  price {\n    currencyCode\n    centAmount\n    formattedAmount\n    __typename\n  }\n  attributes {\n    availabilityStatus\n    canAddToBag\n    colour\n    colourFamily\n    designNumber\n    mainGroup\n    materialGroup\n    materialType\n    maxOrderQuantity\n    showInListing\n    __typename\n  }\n  __typename\n}\n\nfragment UserData on LegoUser {\n  pabCart {\n    id\n    PABLineItems {\n      id\n      quantity\n      element {\n        id\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  __typename\n}\n\nfragment PABLineItemData on PABCartLineItem {\n  id\n  quantity\n  element {\n    id\n    name\n    primaryImageUrl\n    __typename\n  }\n  price {\n    centAmount\n    currencyCode\n    __typename\n  }\n  elementVariant {\n    id\n    attributes {\n      designNumber\n      __typename\n    }\n    __typename\n  }\n  totalPrice {\n    formattedAmount\n    __typename\n  }\n  __typename\n}\n"
    }

    $.ajax({
        type: "POST",
        url: "https://www.lego.com/api/graphql/PickABrickQuery",
        contentType: "application/json",
        dataType: "json",
        //xhrFields: { withCredentials: false },
        //crossDomain: true,
        async: false,
        headers: { "x-locale": $('#pabLanguage').children("option:selected").val() },
        data: JSON.stringify(PickABrickQuery),
        success: function (data) {
            result = data.data.elements.results;
        }
    });

    return result;
}

function loadBrickLinkAlternativeNumbers(itemNo) {
    $.ajax({
        type: "GET",
        url: `https://www.bricklink.com/v2/catalog/catalogitem.page?P=${itemNo}`,
        async: false,
        success: function (data) {
            result = $(data).contents().find("span:contains('Alternate Item No')").children()[1]?.innerHTML;
        }
    });

    return result;
}