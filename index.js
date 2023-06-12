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
    if(fs.existsSync("./out")) fs.rmSync("./out", {recursive: true});
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
@Entity${getVererbs(klass, dat)}
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

    // Do moch ma Main
    let txt = "";
    txt+=`    
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

`;

txt+=`
public class Main {
    private static final String PERSISTENCE_UNIT_NAME = "cool_MySQL";
    private static EntityManagerFactory factory;
    
    public static void main(String[] args) throws Exception {
        factory = Persistence.createEntityManagerFactory(PERSISTENCE_UNIT_NAME);
        EntityManager em = factory.createEntityManager();
        em.getTransaction().begin();

        `;

    dat.forEach((klass) => {
        txt+=`${klass.name} ${klass.name.toLowerCase()}1 = new ${klass.name}();
        `;
        klass.attributen?.forEach(att => {
            txt +=`${klass.name.toLowerCase()}1.set${capitalizeFirstLetter(att.name)}(${genRandAtt(att)});
        `;
        });
    });

    txt += "\n\t\t";

    dat.forEach((klass) => {
        console.log(klass);
        klass.bezi?.forEach((bez) => {
            if(bez.mult.startsWith("1")){
                txt+=`${klass.name.toLowerCase()}1.set${capitalizeFirstLetter(bez.name)}(${bez.klasse.toLowerCase()}1);
        `;
            }

            if(bez.mult.startsWith("*")){
                txt+=`${klass.name.toLowerCase()}1.get${capitalizeFirstLetter(bez.name)}.add(${bez.klasse.toLowerCase()}1);
        `;
            }
        });
    });

    dat.forEach((klass) => {
        txt+=`
        em.persist(${klass.name.toLowerCase()}1);`;
    });

    txt+=`
        em.getTransaction().commit();`;

    txt+="\n\t}\n}\n";

    fs.writeFileSync("./out/Main.java", txt);

    
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

function genRandAtt(att){
    if(att.type == "string"){
        const tmp = ["Dings", "Wurzel", "Ramsi", "Hartmann", "Kek", "Jeff", "Lorem", "Ipsum"];
        return `"${tmp[Math.floor(Math.random() * tmp.length)]}"`;
    }
    if(att.type == "int" || att.type == "long" || att.type == "float"){
        return Math.floor(Math.random() * 10_000);
    }
    if(att.type == "date"){
        return `new Timestamp(${Math.floor(Math.random() * 1_686_553_410_116)})`;
    }
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

    // console.log(bez, bez2);
    
    let txt = "@";
    txt+= getBeziMult(bez2.mult) + "To" + getBeziMult(bez.mult) + `(${getMappedBy(bez, bez2)})`;
    txt+= getJoinColumns(bez, bez2);
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
    if(m1.includes("*")){
        return "Many";
    }else if(m1.includes("1")){
        return "One";
    }

    return "One";
}

function getMappedBy(bez, bez2){
    // OneToMany
    if(getBeziMult(bez2.mult) == "Many" && getBeziMult(bez.mult) == "One")
    return `mappedBy = "${bez2.name}"`;

    // ManyToOne
    if(getBeziMult(bez2.mult) == "One" && getBeziMult(bez.mult) == "Many")
    return `fetch = FetchType.EAGER`;

    // if(getBeziMult(bez2.mult) == "One" && getBeziMult(bez.mult) == "One") console.log(bez.randomW, bez2.randomW)
    // OneToOne
    if(getBeziMult(bez2.mult) == "One" && getBeziMult(bez.mult) == "One" && parseInt(bez2.randomW) > parseInt(bez.randomW))
    return ``;
    if(getBeziMult(bez2.mult) == "One" && getBeziMult(bez.mult) == "One" && parseInt(bez2.randomW) < parseInt(bez.randomW))
    return `mappedBy = "${bez2.name}"`;

    // ManyToMany
    if(getBeziMult(bez2.mult) == "Many" && getBeziMult(bez.mult) == "Many" && parseInt(bez2.randomW) > parseInt(bez.randomW))
    return `cascade = CascadeType.PERSIST`;
    if(getBeziMult(bez2.mult) == "Many" && getBeziMult(bez.mult) == "Many" && parseInt(bez2.randomW) < parseInt(bez.randomW))
    return `mappedBy = "${bez2.name}"`;
}

function getJoinColumns(bez, bez2){
    if(getBeziMult(bez2.mult) == "Many" && getBeziMult(bez.mult) == "Many" && parseInt(bez2.randomW) > parseInt(bez.randomW)){
        return `
    @JoinTable (
        name = "${bez.klasse.toUpperCase()}_${bez2.klasse.toUpperCase()}",
        joinColumns = {@JoinColumn(name = "${bez.klasse.toLowerCase()}OID")},
        inverseJoinColumns = {@JoinColumn(name = "${bez2.klasse.toLowerCase()}OID")}
    )`;
    }

    if(getBeziMult(bez2.mult) == "One" && getBeziMult(bez.mult) == "One" && parseInt(bez2.randomW) > parseInt(bez.randomW)){
        return `
    @JoinColumn(name = "${bez.klasse.toLowerCase()}OID")`;
    }

    return "";
}

function getVererbs(klass, dat){
    let txt = "";
    dat.forEach(val => {
        if(val.vererb != undefined && val.vererb == klass.name){
            txt+=`
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)`;
        }
    });

    return txt;
}

app.listen(settings.port, () => console.log("Listening to port "+settings.port));