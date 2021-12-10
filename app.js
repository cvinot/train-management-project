const express = require('express')
const fs = require('fs')
const app = express()
const dotenv = require('dotenv');
const mysql = require('mysql');

// Getting environment variables
dotenv.config();
const PORT = process.env.PORT

// Serving client and initializing express
app.use(express.static('client'));
app.use(express.json());

// TESTING PURPOSE
let todos = []

// Defining database connection
var db  = mysql.createPool({
    connectionLimit : 10,
    host            : process.env.DB_HOST,
    user            : process.env.DB_USER,
    password        : process.env.DB_PASSWORD,
    database        : process.env.DB,
    multipleStatements : true
});

// --------------------------------- ROUTER ---------------------------------


// ----------- ATHENTIFICATION -----------
// Client register
app.post('/auth', (req,res) => {
    var {nom,prenom,password,age,username} = req.body
    // Crée le profile client
    db.query(`INSERT INTO client(nom, prenom, password, age, username) VALUES (${nom},${prenom},${password},${age},${username}`, function(err, rows, fields) {
        if (err) throw err;
    });
    // récupère l'id client et l'id reservation :
    db.query(`SELECT id_client, id_reservation from client join reservation on client.id_client = reservation.id_client
    where reservation.confirmation = 0 and client.nom = ${nom} and ${prenom},${password},${age},${username}`, function(err, rows, fields) {
        if (err) throw err;
    });
    res.send(trajets)
})

// Client login check
app.get('/auth', (req,res) => {
    var {username,password} = req.query
    db.query(`SELECT * FROM  client WHERE username = '${username}' AND password = '${password}'`, function(err, rows, fields) {
        if (err) throw err; 
        res.send(rows)
    });
})

// ----------- TRAJETS & RESERVATIONS -----------

// Returns the cheapest available billet for each trajet 
app.get('/trajets', (req,res) => {
    var current_res_id = req.query.current_res_id
    db.query(
        `select trajet.*, min(b.prix), b.*, reservation.*, gare_dep.nom as "gare_dep", gare_dep.ville as "ville_dep", gare_arr.nom as "gare_arr", gare_arr.ville as "ville_arr"
        from billet as b
        join trajet on trajet.id_trajet = b.id_trajet
        left join billet_reservation on b.id_billet = billet_reservation.id_billet
        left join reservation on billet_reservation.id_reservation = reservation.id_reservation
        left join gare on trajet.id_gare_dep
        left join gare as gare_dep on gare_dep.id_gare = trajet.id_gare_dep
        left join gare as gare_arr on gare_arr.id_gare = trajet.id_gare_arr
        where (reservation.confirmation =0
        or reservation.confirmation is null)
        AND (b.id_billet not in (select br.id_billet from billet_reservation as br where br.id_reservation = ${current_res_id}))
        group by trajet.id_trajet`,
     function(err, rows, fields) {
        if (err) throw err;
        console.log(rows)

        // convert date to frontend format
        res.send(rows)
    });
})

app.post('/trajets', (req,res) => {
    // create all billets
    var {id_train,id_gare_dep,id_gare_arr,h_dep,h_arr,date_dep,date_arr,prix} = req.body
    db.query(`select * from train as t
    inner join voiture as v on t.id_train = v.id_train
    inner join place as p on v.id_voiture = p.id_voiture
    where t.id_train =${id_train}`,
     function(err, rows, fields) {  
        var places = rows
        if (err) throw err;
        db.query(`insert into trajet(id_gare_dep,id_gare_arr,date_dep,heure_dep,date_arr,heure_arr,id_train)
        values(${id_gare_dep},${id_gare_arr},"${date_dep}","${h_dep}","${date_arr}","${h_arr}",${id_train});
        select last_insert_id() from trajet`,
            function(err, rows, fields) {
            if (err) throw err;
            var id_trajet = rows[1][0]['last_insert_id()']
            var query = 'insert into billet(id_trajet,prix,id_place) values '
            for (var index in places){
                var id_place = places[index].id_place
                query += '('+id_trajet+','+prix+','+id_place +'),'
            }
            query = query.slice(0,-1)
            db.query(`${query}`, function(err) {
                if (err) {
                    throw err; 
                }
                res.send()
            })
        });
    })
});

// GET all current user reservation
app.get('/reservation', (req,res) => {
    var client = req.query
    // Get all reservations of user
    db.query(`select distinct voiture.numero as numero_voiture, place.numero_place, place.type_place, trajet.*, billet.*, reservation.confirmation, reservation.id_reservation,
    gare_dep.nom as "gare_dep", gare_dep.ville as "ville_dep", gare_arr.nom as "gare_arr", gare_arr.ville as "ville_arr"from reservation 
       left join billet_reservation on reservation.id_reservation = billet_reservation.id_reservation
       left join billet on billet_reservation.id_billet = billet.id_billet
       left join trajet on billet.id_trajet = trajet.id_trajet
       left join gare as gare_dep on gare_dep.id_gare = trajet.id_gare_dep
       left join gare as gare_arr on gare_arr.id_gare = trajet.id_gare_arr
       left join place on billet.id_place = place.id_place
       left join voiture on place.id_voiture = voiture.id_voiture
       where reservation.id_client = ${client.id_client}`, function(err, rows, fields) {
        if (err) {
            throw err; 
        }
        var current_reservation = []
        var billets = []
        for (var x in rows){
            if(rows[x].confirmation === 1){
                billets.push(rows[x])
            }else{
                current_reservation.push(rows[x])
            }
        }
        res.send({current_reservation,billets})
    });
})

// Adds the billet into the reservation
app.post('/reservation', (req,res) => {
    var {id_billet,id_reservation} = req.body
    db.query(`insert into billet_reservation(id_reservation,id_billet)
    values (${id_reservation},${id_billet})`, function(err) {
        if (err) {
            throw err; 
        }
        res.send()
    })
})

// Removes billet from reservation
app.delete('/reservation', (req,res) => {
    var {id_billet,id_reservation} = req.body
    db.query(`delete from billet_reservation
    where id_billet = ${id_billet} AND id_reservation = ${id_reservation}`, function(err) {
        if (err) {
            throw err; 
        }
        res.send()
    });
})

// confirm reservation
app.put('/reservation', (req,res) => {
    // first confirms the current reservation
    var {id_reservation,id_client} = req.body
    db.query(`UPDATE reservation set confirmation = 1 where id_reservation = ${id_reservation}`, function(err) {
        if (err) {
            throw err; 
        }
        // now create a new empty reservation
        db.query(`INSERT INTO reservation(id_client,confirmation) VALUES(${id_client},0)`, function(err) {
        if (err) {
            throw err; 
        }
        // now create a new empty reservation
        
        res.send()
    })
    })
})

// Returns the whole reductions table
app.get('/reductions', (req,res) => {
    db.query(`select * from reduction`,
     function(err, rows, fields) {
        if (err) throw err;
        res.send(rows)
    });
})

// Returns the whole trains x voitures table
app.get('/trains', (req,res) => {
    db.query(`select * from train`,
     function(err, rows, fields) {
        if (err) throw err;
        res.send(rows)
    });
})

// Returns the whole gares table
app.get('/gares', (req,res) => {
    db.query(`select * from gare`,
     function(err, rows, fields) {
        if (err) throw err;
        res.send(rows)
    });
})

app.post('/gares', (req,res) => {
    var nom = req.body.nom
    var ville = req.body.ville
    db.query(`insert into gare(nom,ville) values("${nom}","${ville}")`,
     function(err, rows, fields) {
        if (err) throw err;
        res.send()
    });
})

app.post('/trains', (req,res) => {
    db.query(`insert into train values();
    select last_insert_id() from train`,
     function(err, rows, fields) {
        var voitures = req.body
        if (err) throw err;
        var id_train = rows[1][0]['last_insert_id()']
        var values_voitures =''
        for (var index in voitures){
            var voiture = voitures[index]
            values_voitures += '('+id_train+','+voiture.nbr_place+','+voiture.numero+'),'
        }
        values_voitures = values_voitures.slice(0,-1)
        db.query(`insert into voiture(id_train,nombre_place,numero) values ${values_voitures}`,
            function(err, rows, fields) {
                if (err) throw err;    
                res.send({id_train :id_train})
        });
    });
})


app.listen(PORT, () => {
    console.log('I listen on port '+PORT)
})