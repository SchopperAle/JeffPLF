const express = require("express");
const fs = require("fs");
const app = express();

const settings = JSON.parse(fs.readFileSync("./settings.json").toString("utf-8"));

app.use("/node_modules", express.static("node_modules"));
app.use("/www", express.static("www"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.redirect("/www/");
});

app.get("/www/", (req, res) => {
    res.sendFile(__dirname+"/www/index.html");
});

app.post("/gen", (req, res) => {
    console.log(req.body.daten, JSON.stringify(req.body.daten));
    fs.rmSync("./out", {recursive: true});
    fs.mkdirSync("out");

    let dat = req.body.daten;
    dat.forEach((klass) => {


let txt = "";
txt+=`
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.sql.Timestamp;

`;

txt+=`
@Entity
public class ${klass.name} ${(klass.vererb == undefined) ? "" : "extends "+klass.vererb+" "}{
    public ${klass.name}() {

    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long oid;

    public Long getOid() {
        return oid;
    }

    public void setOid(Long oid) {
        this.oid = oid;
    }

`;

klass.attributen?.forEach(att => {
    txt+=`
    private ${getType(att.type)} ${att.name};

    public void set${capitalizeFirstLetter(att.name)}(${getType(att.type)} ${att.name}) {
        this.${att.name} = ${att.name};
    }

    public ${getType(att.type)} get${capitalizeFirstLetter(att.name)}() {
        return ${att.name};
    }
    `;
});

klass.bezi?.forEach(bez => {
    txt+=`
    ${getBezi(bez, dat)}
    `;
});


txt+=`
}
`;

fs.writeFileSync("./out/"+klass.name+".java", txt);



    });
    
    res.send("DINGS");
});

function getType(type) {
    if(type == "string"){
        return "String";
    }else if(type == "int" || type == "integer"){
        return "int";
    }else if(type == "date"){
        return "Timestamp";
    }else if(type == "float"){
        return "float";
    }else if(type == "long"){
        return "long";
    }

    return type;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getBezi(bez, dat){
    let bez2;
    dat.forEach((klass) => {
        klass.bezi?.forEach(bezi => {
            if(bezi != bez && bezi.bezi == bez.bezi){
            bez2 = bezi;
            }
        });
    });

    console.log(bez, bez2);
    
    let txt = "@";
    txt+= getBeziMult(bez2.mult) + "To" + getBeziMult(bez.mult) + `(mappedBy = "${bez2.name}")`;
    txt+= `\n\tprivate ${(getBeziMult(bez.mult) == "Many")? "List<"+bez.klasse+">" : bez.klasse} ${bez.name}`+((getBeziMult(bez.mult) == "Many")? " = new ArrayList<>();": ";") + "\n\n\t";
    txt+=`public void set${capitalizeFirstLetter(bez.name)}(${(getBeziMult(bez.mult) == "Many")? "List<"+bez.klasse+">" : bez.klasse} ${bez.name}){
        this.${bez.name} = ${bez.name};
    }
    `;
    txt+=`public ${(getBeziMult(bez.mult) == "Many")? "List<"+bez.klasse+">" : bez.klasse} get${capitalizeFirstLetter(bez.name)}(){
        return ${bez.name};
    }`;
    return txt;
}

function getBeziMult(m1){
    if(m1?.includes("*")){
        return "Many";
    }else if(m1?.includes("1")){
        return "One";
    }

    return "One";
}

app.listen(settings.port, () => console.log("Listening to port "+settings.port));