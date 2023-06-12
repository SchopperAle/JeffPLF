let daten = [];
let selected, selectedAttribut, selectedVererb, selectedBezi;
let vererb = false, bezi = false;














document.getElementById("genClasses").addEventListener("click", () => {
    // $.post({url:"/gen", data:{data:document.getElementById("center").innerHTML}});
    // console.log(document.getElementById("center").innerHTML)

    let data = [];

    document.getElementById("center").childNodes.forEach((klass) => {
        klass.childNodes.forEach((val) => {
            if(val.className == "klassenname"){
                data.push({name:val.innerText, id:klass.id, attributen:[], bezi:[]});
                return;
            }

            if(val.className == "klassenattribute"){
                val.childNodes.forEach((val2) => {
                    data[data.length-1].attributen.push({name:(val2.childNodes[0].innerText), type:(val2.childNodes[2].innerText)});
                });
                return;
            }

            if(val.className.startsWith("vererb")){
                data[data.length-1].vererb = copy($(`#${val.getAttribute("data-vererb")} .klassenname`).text());
            }

            if(val.className.startsWith("bezi")){
                console.log(val)
                data[data.length-1].bezi.push({target:val.getAttribute("data-bezit"), bezi:val.getAttribute("data-bezi"), klasse:val.childNodes[1].innerText, name:val.childNodes[3].innerText, mult:val.childNodes[5].innerText, randomW: Math.floor(Math.random() * 10_000_000)});
            }
        })
    })

    console.log(data)
    $.post({url:"/gen", data:{daten:JSON.parse(JSON.stringify(data))}, method:"POST"});
    // postn(data);
});

function postn(data){
    $.post({url:"/gen", data:{daten:JSON.parse(JSON.stringify(data))}, method:"POST"});
}

function copy(obj){
    return JSON.parse(JSON.stringify(obj)); 
}



setListener();
function setListener(){
    $("#klassep").on("click", () => {
        let tmp = genID(32);
        $("#center").append(`<div class="klasse" id="${tmp}"><div class="klassenname" contenteditable>Klasse</div><div class="klassenattribute"></div></div>`);
        
        $("#"+tmp).on("click", () => {
            if(vererb){
                let pos2 = $("#"+tmp);
                let tmp2 = genID(30);
                selected.append(`<div data-vererb="${pos2.attr("id")}" id="${tmp2}" class="vererb">Extends <div class="inline">${$("#"+pos2.attr("id")+" .klassenname").text()}</div></div>`);
                $("#"+tmp2).on("click", () => {
                    selectedVererb?.removeClass("selectedvererb");
                    selectedVererb = $("#"+tmp2);
                    selectedVererb.addClass("selectedvererb");
                });
                resetCD();
            }

            if(bezi){
                let p1 = selected;
                let p2 = $("#"+tmp);
                let tmp2 = genID(33);
                let tmp31 = genID(34);
                let tmp32 = genID(34);
                p1.append(`<div id="${tmp31}" data-bezit="${p2.attr("id")}" data-bezi="${tmp2}" class="bezi">
                    <div class="beziKlasse inline">${$("#"+p2.attr("id")+" .klassenname").text()}</div> - 
                    <div class="beziName inline" contenteditable>${$("#"+p2.attr("id")+" .klassenname").text().toLowerCase()}</div> : 
                    <div class="beziMult inline" contenteditable>1</div>
                </div>`);

                $("#"+tmp31).on("click", () => {
                    document.querySelectorAll(`div[data-bezi="${selectedBezi}"]`)?.forEach((val) => {
                        $("#"+val.id).removeClass("selectedbezi");
                    });
                    selectedBezi = tmp2;
                    document.querySelectorAll(`div[data-bezi="${selectedBezi}"]`).forEach((val) => {
                        $("#"+val.id).addClass("selectedbezi");
                    });
                });
                
                p2.append(`<div id="${tmp32}" data-bezit="${p1.attr("id")}" data-bezi="${tmp2}" class="bezi">
                    <div class="beziKlasse inline">${$("#"+p1.attr("id")+" .klassenname").text()}</div> - 
                    <div class="beziName inline" contenteditable>${$("#"+p1.attr("id")+" .klassenname").text().toLowerCase()}</div> : 
                    <div class="beziMult inline" contenteditable>1</div>
                </div>`);

                $("#"+tmp32).on("click", () => {
                    document.querySelectorAll(`div[data-bezi="${selectedBezi}"]`)?.forEach((val) => {
                        $("#"+val.id).removeClass("selectedbezi");
                    });
                    selectedBezi = tmp2;
                    document.querySelectorAll(`div[data-bezi="${selectedBezi}"]`).forEach((val) => {
                        $("#"+val.id).addClass("selectedbezi");
                    });
                });

                resetCD();
            }

            selected?.removeClass("selected");
            selected = $("#"+tmp);
            selected.addClass("selected");
        });

        resetCD();

        $("#"+tmp+" .klassenname").on("input", () => {
            document.querySelectorAll(`div[data-vererb="${$("#"+tmp).attr("id")}"]`).forEach((val) => {
                $(`#${val.id} .inline`).text($("#"+tmp).text());
            });
        });
    });

    $("#attributp").on("click", () => {
        if(selected == undefined) return;
        let tmp = genID(32);
        $(`#${selected.attr("id")} .klassenattribute`).append(`<div id="${tmp}" class="attribut"><div class="attributname inline" contenteditable>Attribut</div> : <div class="attributtyp inline" contenteditable>string</div></div>`)
        $("#"+tmp).on("click", () => {
            selectedAttribut?.removeClass("selectedattribut");
            selectedAttribut = $("#"+tmp);
            selectedAttribut.addClass("selectedattribut");
        });
        resetCD();
    });

    $("#klassem").on("click", () => {
        document.querySelectorAll(`div[data-vererb="${selected.attr("id")}"]`).forEach((val) => {
            val.remove();
        });

        selected?.remove();
        selected = undefined;
        resetCD();
    });

    $("#attributm").on("click", () => {
        selectedAttribut?.remove();
        selectedAttribut = undefined;
        resetCD();
    });

    $("#vererbungp").on("click", () => {
        if(selected == undefined) return;
        resetCD();
        vererb = true;
    });

    $("#vererbungm").on("click", () => {
        selectedVererb?.remove();
        selectedVererb = undefined;
        resetCD();
    });

    $("#beziehungp").on("click", () => {
        if(selected == undefined) return;
        resetCD();
        bezi = true;
    });

    $("#beziehungm").on("click", () => {
        document.querySelectorAll(`div[data-bezi="${selectedBezi}"]`)?.forEach((val) => {
            $("#"+val.id).remove();
        });
        selectedBezi = undefined;
        resetCD();
    });
}

function resetCD(){
    vererb = false;
    bezi = false;
}


function genID(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}