var app = new Vue({
    el: '#app',
    data: {
      todos: [],      
      newTitle: '',
      newContent: '',
      filterImportant: 'all',
    },
    watch: {
    },
    computed: {
      filteredTodos() {
        if(this.filterImportant === 'all') {
          return this.todos
        } else {
          let importantFilter = false
          if(this.filterImportant === "important-only") {
            importantFilter = true
          }
          return this.todos.filter(todo => todo.important === importantFilter)
        }
      }
    },
    methods: {
      createTodo() {
        const newTodo = {
          title: this.newTitle,
          content: this.newContent,
          important: false
        }
        window.axios.post("todos", newTodo).then(response => {
          this.todos = response.data // optionnal, allow to refresh the list
        })
        this.todos.push(newTodo)
        this.newTitle = ""
        this.newContent = ""
      },
      markImportant(todo, index, important) {
        todo.important = important
        window.axios.put("todos/"+index, todo)
      },
      deleteTodo(index) {
        this.todos.splice(index,1)
        window.axios.delete("todos/"+index).then(response => {
          this.todos = response.data // optionnal, allow to refresh the list
        })
      }
    },
    mounted: function() {
      window.axios.get("todos").then(response => {
        this.todos = response.data
      })
    }
  })