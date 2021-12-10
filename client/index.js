var app = new Vue({
    el: '#app',
    data: {
      showModal: true,
      failedLogin:false,

      username: '', // username entered by client
      password: '', // password --

      client:{},    // full client profile after login
      admin:false,  // if client is admin, shows admin interface 
      
      // Search data
      villeDepart:'',
      villeArrivee:'',
      dateDepart: '',
      heureDepart:'',

      trajets: [],            // cheapest billet of each available trajet
      filteredTrajets: [],    // same as above, but filtered with search data
      current_reservation:{}, // = the only not confirmed reservation of logged user
      current_res_id:'',      // if of ongoing, unconfirmed reservation. 'panier'
      billets:[],             // billet of confirmed reservations (supposed paid)
      reductions:[],          // all reductions

      // custom select values 
      current_reduction:{},

      // --------- ADMIN INTERFACE VALUES ---------
      gares:[],
      trains:[],

      // creation train 
      new_voiture_place : '',
      new_train_voitures:[],

      // creation gare
      new_gare_nom:'',
      new_gare_ville:'',

      // creation trajet 
      new_train_id:'',
      new_gare_dep:'',
      new_gare_arr:'',
      new_date_dep:'',
      new_h_dep:'',
      new_date_arr:'',
      new_h_arr:'',
      new_prix:'',

    },
    watch: {
    },
    computed: {
      // reductions the client can choose (current reservation fits the conditions)
      available_reductions(){
        var client_age = this.client.age
        var current_reservation = this.current_reservation
        var reductions = this.reductions
        // find the earlies departure among the billets of current reservation, and save it as reference
        var min_date = current_reservation.reduce(function(prev, curr) {
          return prev.date_dep < curr.date_dep ? prev : curr;
        }).date_dep
        // for each reduction, check two things : 
        // first, is the client in the age range 
        // second, are the billets in the date range 
        return reductions.filter(reduction => { 
            if (reduction.age_min && (client_age < reduction.age_min)) return false
            if (reduction.age_max && (client_age > reduction.age_max)) return false
            if (reduction.J_moins){
              var date1 = new Date(min_date);
              var date2 = new Date();
              var diffTime = Math.abs(date2 - date1);
              var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (diffDays < reduction.J_moins) return false
            }
            return true
        })
      },
      prix_res(){
        // sum of current reservation price, taking the chosen reduction into account
        var value = 0
        for (var index in this.current_reservation){
          value += this.current_reservation[index].prix
        }
        // minus the reduction ...
        if(this.current_reduction.pourcentage){
          value*= (1-this.current_reduction.pourcentage)
        }
        return value
      },
    },
    methods: {
      convertDate(date){ 
        // prend un format de date javascript, et renvoie en format yyyy-mm-dd
        var newdate = date
        var dd = String(newdate.getDate()).padStart(2, '0');
        var mm = String(newdate.getMonth() + 1).padStart(2, '0'); 
        var yyyy = newdate.getFullYear();
        newdate = yyyy + '-' + mm + '-' + dd;
        return newdate
      },
      login() {
        // username + password
        window.axios.get("auth", { params: { username: this.username , password : this.password }}).then(response => {
          if (response.data.length>0){
            this.showModal = false
            this.client = response.data[0]
            localStorage.setItem('client', this.client)
            this.loadInfo()
          }else{
            this.failedLogin = true
          }
        })
      },
      register() {
        // check if username is available
      },
      // On user login, loads personnal data
      loadInfo() {
        var vm = this
        // -------------------- IF THE USER IS CLIENT --------------------
        if (!vm.client.admin){  
          // loads existing reductions
          // the table is not meant to be big, so it's okay to get it all and store it in local to match ids
          window.axios.get("reductions").then(response => {
            vm.reductions = response.data
          })
          // loads reservations of user
          window.axios.get("reservation", { params: this.client }).then(response => {
            var {current_reservation,billets} = response.data
            vm.current_res_id = current_reservation[0].id_reservation
            // finds the current reduction
            var current_reduction_id = current_reservation[0].id_reduction
            if (current_reduction_id){
              vm.current_reduction = vm.reductions.find(x => x.id_reduction === current_reduction_id);
              vm.current_reduction_name = vm.current_reduction.type_reduction
            }
            // cheapest available billet for each trajet, excluding ones already reserved by user
          window.axios.get("trajets", { params: {current_res_id :vm.current_res_id} }).then(response => {
            response.data.map( trajet => {
              var newtraj = trajet
              newtraj.date_dep = vm.convertDate(new Date(trajet.date_dep));
              newtraj.date_arr = vm.convertDate(new Date(trajet.date_arr));
              return newtraj
            })
            this.trajets = response.data
          })
            // if there is at least one reserved billet, format dates
            if(current_reservation[0].date_dep){
              current_reservation.map( trajet => {
                  var newtraj = trajet
                  newtraj.date_dep = vm.convertDate(new Date(trajet.date_dep));
                  newtraj.date_arr = vm.convertDate(new Date(trajet.date_arr));
                  return newtraj
                })
                vm.current_reservation = current_reservation
            }else{
              // that means there is no billet in the current reservation, they should not be displayed
              vm.current_reservation = []
            }
            // format reserved billet if needed
            if(billets.length > 0){
              billets.map( trajet => {
                  var newtraj = trajet
                  newtraj.date_dep = vm.convertDate(Date(trajet.date_dep));
                  newtraj.date_arr = vm.convertDate(Date(trajet.date_arr));
                  return newtraj
                })
            }
            this.billets = billets
          })
        }else{ // -------------------- IF THE USER IS ADMIN --------------------
          vm.admin = 'true'
          // gare
          window.axios.get("gares").then(response => {
            vm.gares = response.data
          })
          // train, voitures
          window.axios.get("trains").then(response => {
            vm.trains = response.data
          })
        }
      },
      // filters trajets depending on criterias, and store them
      filterTrajets(e) {
        if(this.villeDepart && this.villeArrivee && this.heureDepart && this.dateDepart){
          // no page reload
          if(e){
            e.preventDefault();
          }
          var vm = this
          var trajets = this.trajets
          var filteredTrajets = trajets.filter(function(trajet){
            return (trajet.ville_dep.toUpperCase() === vm.villeDepart.toUpperCase()
              && trajet.ville_arr.toUpperCase() === vm.villeArrivee.toUpperCase()
              && trajet.date_dep === vm.dateDepart
              && trajet.heure_dep >= vm.heureDepart)
          });
          vm.filteredTrajets = filteredTrajets
        }
      },
      // Effectue une reservation pour le client, sous reserve qu'un billet est disponible
      reserveTrajet(index) {
        // récupère les id 
        var vm=this
        var trajet = vm.filteredTrajets[index]
        var body = {
          id_billet : trajet.id_billet,
          id_reservation : vm.current_res_id
        }
        // send request to database, to reserve the billet
        window.axios.post("reservation", body).then(response => {
          // add billet to local reservation state
          vm.current_reservation.push(trajet)
          // remove billet from available trajets to avoid duplicates
          vm.loadInfo()
          vm.filteredTrajets = []
        })
      },
      // removes a trajet 
      removeTrajet(index) {
        var vm = this
        // Retire trajet de reservation en cours
        var trajet = vm.current_reservation[index]
        var body = {
          id_billet : trajet.id_billet,
          id_reservation : vm.current_res_id
        }
        // send request to database, to remove the billet from reservation
        window.axios.delete("reservation", {data : body}).then(response => {
          // add billet to local reservation state
          // remove billet from available trajets to avoid duplicates
          vm.current_reservation.splice(index, 1)
          vm.filterTrajets()
        })
      },
      confirmReservation() {
        var vm = this
        // Confirme l'object reservation
        var id_reservation = vm.current_res_id
        var id_client = vm.client.id_client
        window.axios.put("reservation", {id_reservation,id_client}).then(response => {
          vm.billets = vm.billets.concat(vm.current_reservation)
          vm.current_reservation = []
        })
      },
      addVoiture(e) {
        e.preventDefault()
        var nbr_place = this.new_voiture_place;
        if(nbr_place>0){
          var numero_voiture = this.new_train_voitures.length +1
          this.new_train_voitures.push(
            {nbr_place: nbr_place, numero: numero_voiture}
          );
          this.new_voiture_place = '';
        }
      },
      createTrain(e) {
        e.preventDefault()
        var vm = this
        // Envoie le nouveau train à créer, constitué de l'ensemble de ses voitures
        // récupère l'id du train, 
        var body = vm.new_train_voitures
        window.axios.post("trains", body).then(response => {
          window.alert('Train numéro : '+String(response.data.id_train)+' ajouté')
          this.loadInfo()
          vm.new_train_voitures = []
        })
      },
      createGare(e) {
        e.preventDefault()
        var vm = this
        // Envoie la nouvelle gare à créer
        var body = {nom :vm.new_gare_nom,ville:vm.new_gare_ville}
        window.axios.post("gares", body).then(response => {
          vm.new_gare_nom = ''
          vm.new_gare_ville = ''
          window.alert(body.nom +' à '+ body.ville +' correctement ajouté')
          this.loadInfo()
        })
      },
      // Créer pour chaque voiture du train concerné, un nouveau trajet
      createTrajet(e){
        var vm = this
        if (vm.new_train_id && vm.new_gare_dep && vm.new_gare_arr && vm.new_date_dep && vm.new_date_arr && vm.new_h_dep && vm.new_h_arr && vm.new_prix){
          e.preventDefault()
          var vm = this
          // récupère les identifiants des gares séléctionnées
          var id_gare_dep = vm.new_gare_dep.id_gare
          var id_gare_arr = vm.new_gare_arr.id_gare
          var body = {id_train :vm.new_train_id.id_train,
          id_gare_dep:id_gare_dep,
          id_gare_arr:id_gare_arr,
          h_dep:vm.new_h_dep,
          h_arr:vm.new_h_arr,
          date_dep:vm.new_date_dep,
          date_arr:vm.new_date_arr,
          prix:vm.new_prix
          }
          if (vm.new_date_dep > vm.new_date_arr || (vm.new_date_dep === vm.new_date_arr && vm.new_h_dep>vm.new_h_arr)){
            window.alert('Heures du trajet incorrectes')
          }else{



            window.axios.post("trajets", body).then(response => {
              //clear les champs d'entré
              vm.new_train_voitures = []
              window.alert('nouveaux billets générés')
              
            })
          }
        }
      },
    },
    // On page launch
    mounted: function() {
      // set date to today 
      var today = new Date();
      var dd = String(today.getDate()).padStart(2, '0');
      var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
      var yyyy = today.getFullYear();

      this.dateDepart = yyyy + '-' + mm + '-' + dd;
      this.heureDepart = today.getHours() + ":" + today.getMinutes()
      this.new_date_dep = this.dateDepart
      this.new_date_arr = this.dateDepart

    }
  })