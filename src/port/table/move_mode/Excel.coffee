class ExcelMoveMode
	init: (@table, @applicationGridService, @rowSelectedClass) ->
		@table.listenCellEvent 'click', (rowId, element) =>
			columnName = element.attr('data-column')
			@table.toCellEdit rowId, columnName

	beforeHeader: (tr) ->
		input = $('<input></input>').attr 'type', 'checkbox'

		input.on 'click', =>
			checkbox = $(this)
			if checkbox.prop 'checked'
				@applicationGridService.unselectAll(@table.tableId)
				checkbox.prop 'checked', false
			else
				@applicationGridService.selectAll(@table.tableId)
				checkbox.prop 'checked', true

		tr.append $('<th></th>').append(input)

	beforeInsert: (id, tr) ->
		if id is undefined
			tr.append $('<td></td>')
			return

		input = $('<input></input>').attr 'type', 'checkbox'
		input.attr 'data-row-id', id

		input.on 'click', =>
			if @table.hasClassOfRow @table.rowIdOfGlobal(id), @rowSelectedClass
				@applicationGridService.unselect @table.tableId, id
			else
				@applicationGridService.select @table.tableId, id

		tr.append $('<td></td>').append input

	beforeRowSelect: (id) ->
		$('input[data-row-id="' + id + '"]').prop 'checked', true

	beforeRowUnselect: (id) ->
		$('input[data-row-id="' + id + '"]').prop 'checked', false

	move: (input, column) ->
		tableId  = @table.tableId
		rowId    = column.parents().attr('data-id').split('.')[2] if column.parents().length > 0
		columnId = column.attr 'data-column'

		input.on 'keydown', (event) =>
			if event.which is 9 # tab
				event.preventDefault()

				value = input.val()
				@applicationGridService.updateColumn tableId, rowId, columnId, value

				input.replaceWith $('<span></span>').text value
				
				if event.shiftKey is true
					@table._editPreviousCell column
				else
					@table._editNextCell column

			if event.which is 13 # enter
				input.replaceWith $('<span></span>').text input.val()
				
				value = input.val()

				@applicationGridService.updateColumn tableId, rowId, columnId, value

				if event.shiftKey is true
					prevRow = $ column.parent().prev()
					prevColumn = prevRow.find('td[data-column="' + column.attr('data-column') + '"]')

					@table._editCell prevColumn
				else
					nextRow = $ column.parent().next()
					nextColumn = nextRow.find('td[data-column="' + column.attr('data-column') + '"]')

					@table._editCell nextColumn

		input.on 'blur', =>
			value = input.val()
			@applicationGridService.updateColumn tableId, rowId, columnId, value
			input.replaceWith $('<span></span>').text input.val()