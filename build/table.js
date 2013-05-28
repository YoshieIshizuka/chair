var ExcelMoveMode, MoveModeFactory, SequenceMoveMode, Table, TableUIHelper, ViewFilterChanged, ViewSortChanged;

Table = (function() {
  function Table(tableId, table, moveMode, gridService, columnConfigJSON) {
    var _this = this;

    this.tableId = tableId;
    this.table = table;
    this.moveMode = moveMode;
    this.gridService = gridService;
    this.rows = {};
    this.rowsById = {};
    this.numberOfRows = 0;
    this.columnConfig = JSON.parse(columnConfigJSON);
    this.currentCursor = void 0;
    $(document).on('keydown', function(event) {
      var currentRow, nextRow, rowId;

      currentRow = _this.findRow(_this.currentCursor);
      if (currentRow.length === 0) {
        return;
      }
      if (event.which === 32) {
        event.preventDefault();
        rowId = currentRow.attr('data-id').split('.')[2];
        if (currentRow.hasClass('row_selected')) {
          _this.gridService.unselect(_this.tableId, rowId);
        } else {
          _this.gridService.select(_this.tableId, rowId);
        }
      }
      if (event.which === 40) {
        event.preventDefault();
        nextRow = currentRow.next();
        if (nextRow.length !== 0) {
          return _this.cursorRow(nextRow.attr('data-id'));
        }
      } else if (event.which === 38) {
        event.preventDefault();
        nextRow = currentRow.prev();
        if (nextRow.length !== 0) {
          return _this.cursorRow(nextRow.attr('data-id'));
        }
      }
    });
  }

  Table.prototype.reset = function() {
    this.rows = {};
    this.rowsById = {};
    this.numberOfRows = 0;
    return this.currentCursor = void 0;
  };

  Table.prototype.selector = function() {
    return this.table.selector;
  };

  Table.prototype.header = function(columns) {
    var column, newTr, span, th, _base, _base1, _i, _len, _ref;

    this.columns = columns;
    newTr = $('<tr></tr>');
    if (typeof (_base = this.moveMode).beforeHeader === "function") {
      _base.beforeHeader(newTr);
    }
    _ref = this.columns;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      column = _ref[_i];
      th = $('<th></th>').attr('data-column-id', column.id);
      th.on('click', function() {
        var columnId, i;

        columnId = $(this).attr('data-column-id');
        i = $(this).find('i');
        if (i.hasClass('icon-caret-down')) {
          i.removeClass();
          $(this).parents('tr').find('i').each(function(index, element) {
            return $(element).removeClass();
          });
          i.addClass('icon-caret-up');
          return ViewEvent.publish('ViewSortChanged', new ViewSortChanged(columnId, 'asc'));
        } else {
          i.removeClass();
          $(this).parents('tr').find('i').each(function(index, element) {
            return $(element).removeClass();
          });
          i.addClass('icon-caret-down');
          return ViewEvent.publish('ViewSortChanged', new ViewSortChanged(columnId, 'desc'));
        }
      });
      span = $('<span></span>');
      span.append(column.title);
      span.append($('<i></i>'));
      newTr.append(th.append(span));
      this.table.find('thead').append(newTr);
    }
    return typeof (_base1 = this.moveMode).afterHeader === "function" ? _base1.afterHeader(newTr) : void 0;
  };

  Table.prototype.get = function(index) {
    return this.rows[index];
  };

  Table.prototype.getById = function(id) {
    return this.rowsById[id];
  };

  Table.prototype.removeById = function(id) {
    var data;

    this.findRow(id).remove;
    data = this.getById(id);
    delete this.rowsById[id];
    return data;
  };

  Table.prototype.updateById = function(rowId, data) {
    var columnIndex, id, newTr, oldTr, x, _i, _len;

    id = this.rowIdOfGlobal(rowId);
    newTr = $('<tr></tr>').attr('data-id', id);
    oldTr = $(this.table).find('tr[data-id="' + id + '"]');
    this.getById(id = data);
    columnIndex = 0;
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      x = data[_i];
      newTr.append(this.createRowColumn(this.columns[columnIndex], x));
      columnIndex++;
    }
    return oldTr.html(newTr.html());
  };

  Table.prototype.cursorTop = function() {
    var row;

    row = this.get(0);
    return this.cursorRow(this.rowIdOfGlobal(row.id));
  };

  Table.prototype.cursorRow = function(rowId) {
    if (this.currentCursor === void 0) {
      this.addClassToRow(rowId, 'current');
    } else {
      this.removeClassFromRow(this.currentCursor, 'current');
      this.addClassToRow(rowId, 'current');
    }
    return this.currentCursor = rowId;
  };

  Table.prototype.rowIdOfGlobal = function(rowId) {
    return this.tableId + '.' + rowId;
  };

  Table.prototype.insert = function(data, id) {
    var columnConfig, rowId, tr, _base, _base1, _i, _len, _ref;

    if (id === void 0) {
      id = this.guid();
    }
    rowId = this.rowIdOfGlobal(id);
    tr = $('<tr></tr>').attr('data-id', rowId);
    if (typeof (_base = this.moveMode).beforeInsert === "function") {
      _base.beforeInsert(id, tr);
    }
    this.rows[this.numberOfRows++] = {
      id: id,
      data: data
    };
    this.rowsById[id] = data;
    _ref = this.columnConfig;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      columnConfig = _ref[_i];
      tr.append(this.createRowColumn(columnConfig, data[columnConfig.id]));
    }
    this.table.find('tbody').append(tr);
    return typeof (_base1 = this.moveMode).afterInsert === "function" ? _base1.afterInsert(id, tr) : void 0;
  };

  Table.prototype.filterRowExists = function() {
    console.log(this.table.find('tbody tr.filter').length);
    return this.table.find('tbody tr.filter').length !== 0;
  };

  Table.prototype.setFilterRow = function(filter) {
    var columnConfig, tr, _base, _i, _len, _ref;

    if (filter === void 0) {
      filter = {};
    }
    tr = $('<tr></tr>').addClass('filter');
    if (typeof (_base = this.moveMode).beforeInsert === "function") {
      _base.beforeInsert(void 0, tr);
    }
    _ref = this.columnConfig;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      columnConfig = _ref[_i];
      tr.append(this.createFilterColumn(columnConfig, filter[columnConfig.id]));
    }
    return this.table.find('tbody').append(tr);
  };

  Table.prototype.createRowColumn = function(column, value) {
    var td;

    td = $('<td></td>');
    td.addClass(column).attr('data-column', column.id);
    td.attr('data-column-editable', column.editable);
    if (column.editable === false) {
      td.addClass('disabled');
    }
    return td.append($('<span></span>').append(value));
  };

  Table.prototype.createFilterColumn = function(columnConfig, value) {
    var input, td,
      _this = this;

    td = $('<td></td>');
    input = $('<input></input>').attr('type', 'text').attr('data-filter-column', columnConfig.id).val(value).addClass('filter_input');
    input.on('keyup', function() {
      window.clearTimeout(_this.timeoutID);
      return _this.timeoutID = setTimeout(function() {
        var filterConditions;

        filterConditions = [];
        $('.filter_input').each(function(i, input) {
          var columnId;

          columnId = $(input).attr('data-filter-column');
          value = $(input).val();
          return filterConditions.push({
            columnId: columnId,
            value: value
          });
        });
        return ViewEvent.publish("ViewFilterChanged", new ViewFilterChanged(filterConditions));
      }, 450);
    });
    return td.append(input);
  };

  Table.prototype.selectRow = function(rowId, cssClass) {
    var _base, _base1;

    if (typeof (_base = this.moveMode).beforeRowSelect === "function") {
      _base.beforeRowSelect(rowId);
    }
    this.addClassToRow(this.rowIdOfGlobal(rowId), cssClass);
    return typeof (_base1 = this.moveMode).afterRowSelect === "function" ? _base1.afterRowSelect(rowId) : void 0;
  };

  Table.prototype.unselectRow = function(rowId, cssClass) {
    var _base, _base1;

    if (typeof (_base = this.moveMode).beforeRowUnselect === "function") {
      _base.beforeRowUnselect(rowId);
    }
    this.removeClassFromRow(this.rowIdOfGlobal(rowId), cssClass);
    return typeof (_base1 = this.moveMode).afterRowUnselect === "function" ? _base1.afterRowUnselect(rowId) : void 0;
  };

  Table.prototype.addClassToRow = function(id, className) {
    var row;

    row = $(this.findRow(id));
    if (!row.hasClass(className)) {
      return row.addClass(className);
    }
  };

  Table.prototype.addClassToColumn = function(rowId, columnName, className) {
    var column, row;

    row = this.findRow(rowId);
    column = row.find('td[data-column="' + columnName + '"]');
    return column.addClass(className);
  };

  Table.prototype.removeClassFromRow = function(id, className) {
    return this.findRow(id).removeClass(className);
  };

  Table.prototype.removeAllRows = function() {
    this.reset();
    return this.table.find('tbody').html('');
  };

  Table.prototype.removeAllRowsWithout = function(ignoredRowClass) {
    this.reset();
    return this.table.find('tbody tr').each(function(index, element) {
      if (!$(element).hasClass(ignoredRowClass)) {
        return $(element).remove();
      }
    });
  };

  Table.prototype.removeAllClassesFromRow = function(id) {
    var row;

    row = this.findRow(id);
    return row.removeClass();
  };

  Table.prototype.toggleClassToRow = function(id, className) {
    return this.findRow(id).toggleClass(className);
  };

  Table.prototype.hasClassOfRow = function(id, className) {
    return this.findRow(id).hasClass(className);
  };

  Table.prototype.findRow = function(rowId) {
    return $(this.table).find('tr[data-id="' + rowId + '"]');
  };

  Table.prototype.listen = function(id, eventName, callback) {
    return this.findRow(id).on(eventName, function() {
      return callback(id, $(this));
    });
  };

  Table.prototype.listenRowEvent = function(eventName, callback) {
    return this.table.on(eventName, 'tr', function() {
      var id;

      id = $(this).attr('data-id');
      return callback(id, $(this));
    });
  };

  Table.prototype.toRowEdit = function(rowId) {
    var row;

    return row = this.findRow(rowId);
  };

  Table.prototype.toCellEdit = function(rowId, columnId) {
    var column, row;

    row = this.findRow(rowId);
    column = row.find('td[data-column="' + columnId + '"]');
    if (this.isCellEditable(column)) {
      return this._editCell(column);
    }
  };

  Table.prototype.isCellEditable = function(column) {
    return column.attr('data-column-editable') === 'true';
  };

  Table.prototype._editPreviousCell = function(column) {
    column = this.searchEditableColumnToBackward(column);
    if (column === false) {
      return false;
    }
    if (this.isCellEditable(column)) {
      return this._editCell(column);
    }
  };

  Table.prototype.searchEditableColumnToBackward = function(column, depth) {
    var numberOfChildren, parent, prevColumn;

    if (depth == null) {
      depth = 1;
    }
    if (depth > 20) {
      return false;
    }
    prevColumn = column.prev();
    if (this.isCellEditable(prevColumn)) {
      return prevColumn;
    }
    if (prevColumn.length === 0) {
      parent = column.parent().prev();
      numberOfChildren = parent.children().length;
      prevColumn = $(parent.children()[numberOfChildren - 1]);
      if (this.isCellEditable(prevColumn)) {
        return prevColumn;
      }
    }
    return this.searchEditableColumnToBackward(prevColumn, depth + 1);
  };

  Table.prototype.searchEditableColumnToForward = function(column, depth) {
    var nextColumn, nextRow;

    if (depth == null) {
      depth = 1;
    }
    if (depth > 20) {
      return false;
    }
    nextColumn = column.next();
    if (this.isCellEditable(nextColumn)) {
      return nextColumn;
    }
    if (nextColumn.length === 0) {
      nextRow = column.parent().next();
      nextColumn = $(nextRow.children()[0]);
      if (this.isCellEditable(nextColumn)) {
        return nextColumn;
      }
    }
    return this.searchEditableColumnToForward(nextColumn, depth + 1);
  };

  Table.prototype._editNextCell = function(column) {
    column = this.searchEditableColumnToForward(column);
    if (column === false) {
      return false;
    }
    if (this.isCellEditable(column)) {
      return this._editCell(column);
    }
  };

  Table.prototype._editCell = function(column) {
    var input, _base;

    if (column === false) {
      return false;
    }
    input = $('<input type="text"></input>').addClass('inline_edit').val(column.text());
    TableUIHelper.fitInputToCell(input, column);
    column.find("span").replaceWith(input);
    input.select();
    return typeof (_base = this.moveMode).move === "function" ? _base.move(input, column) : void 0;
  };

  Table.prototype.listenCellEvent = function(eventName, callback) {
    return this.table.on(eventName, 'td', function() {
      var id;

      id = $(this).parents('tr').attr('data-id');
      return callback(id, $(this));
    });
  };

  Table.prototype.listenTextEvent = function(eventName, callback) {
    return this.table.find('span').on(eventName, function() {
      var id;

      id = $(this).parents('tr').attr('data-id');
      callback(id, $(this));
      return false;
    });
  };

  Table.prototype.s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };

  Table.prototype.guid = function() {
    return this.s4() + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + '-' + this.s4() + this.s4() + this.s4();
  };

  return Table;

})();

ViewFilterChanged = (function() {
  function ViewFilterChanged(filterConditions) {
    this.filterConditions = filterConditions;
  }

  ViewFilterChanged.prototype.serialize = function() {
    var condition, serializedFilterConditions, _i, _len, _ref;

    serializedFilterConditions = {};
    _ref = this.filterConditions;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      condition = _ref[_i];
      serializedFilterConditions[condition.columnId] = condition.value;
    }
    return serializedFilterConditions;
  };

  return ViewFilterChanged;

})();

ViewSortChanged = (function() {
  function ViewSortChanged(columnId, direction) {
    this.columnId = columnId;
    this.direction = direction;
  }

  ViewSortChanged.prototype.serialize = function() {
    return {
      columnId: this.columnId,
      direction: this.direction
    };
  };

  return ViewSortChanged;

})();

TableUIHelper = (function() {
  function TableUIHelper() {}

  TableUIHelper.fitInputToCell = function(input, column) {
    var ULTRA_COSMIC_CONST_NUMBER, borderBottom, borderLeft, borderRight, borderTop, paddingBottom, paddingLeft, paddingRight, paddingTop;

    paddingLeft = parseInt(column.css('paddingLeft'), 10);
    paddingRight = parseInt(column.css('paddingRight'), 10);
    paddingTop = parseInt(column.css('paddingTop'), 10);
    paddingBottom = parseInt(column.css('paddingBottom'), 10);
    borderLeft = parseInt(column.css('borderLeft'), 10);
    borderRight = parseInt(column.css('borderRight'), 10);
    borderTop = parseInt(column.css('borderTop'), 10);
    borderBottom = parseInt(column.css('borderBottom'), 10);
    ULTRA_COSMIC_CONST_NUMBER = 2;
    input.css('marginLeft', paddingLeft * -1);
    input.css('marginRight', paddingRight * -1);
    input.css('marginTop', (paddingTop + borderTop + ULTRA_COSMIC_CONST_NUMBER) * -1);
    input.css('marginBottom', paddingBottom * -1);
    input.width(column.width() + paddingLeft + paddingRight);
    return input.height(column.height() + paddingTop + paddingBottom + borderTop);
  };

  return TableUIHelper;

})();

ExcelMoveMode = (function() {
  function ExcelMoveMode() {}

  ExcelMoveMode.prototype.init = function(table, applicationGridService, rowSelectedClass) {
    var _this = this;

    this.table = table;
    this.applicationGridService = applicationGridService;
    this.rowSelectedClass = rowSelectedClass;
    return this.table.listenCellEvent('click', function(rowId, element) {
      var columnName;

      columnName = element.attr('data-column');
      return _this.table.toCellEdit(rowId, columnName);
    });
  };

  ExcelMoveMode.prototype.beforeHeader = function(tr) {
    var input,
      _this = this;

    input = $('<input></input>').attr('type', 'checkbox');
    input.on('click', function() {
      var checkbox;

      checkbox = $(_this);
      if (checkbox.prop('checked')) {
        _this.applicationGridService.unselectAll(_this.table.tableId);
        return checkbox.prop('checked', false);
      } else {
        _this.applicationGridService.selectAll(_this.table.tableId);
        return checkbox.prop('checked', true);
      }
    });
    return tr.append($('<th></th>').append(input));
  };

  ExcelMoveMode.prototype.beforeInsert = function(id, tr) {
    var input,
      _this = this;

    if (id === void 0) {
      tr.append($('<td></td>'));
      return;
    }
    input = $('<input></input>').attr('type', 'checkbox');
    input.attr('data-row-id', id);
    input.on('click', function() {
      if (_this.table.hasClassOfRow(_this.table.rowIdOfGlobal(id), _this.rowSelectedClass)) {
        return _this.applicationGridService.unselect(_this.table.tableId, id);
      } else {
        return _this.applicationGridService.select(_this.table.tableId, id);
      }
    });
    return tr.append($('<td></td>').append(input));
  };

  ExcelMoveMode.prototype.beforeRowSelect = function(id) {
    return $('input[data-row-id="' + id + '"]').prop('checked', true);
  };

  ExcelMoveMode.prototype.beforeRowUnselect = function(id) {
    return $('input[data-row-id="' + id + '"]').prop('checked', false);
  };

  ExcelMoveMode.prototype.move = function(input, column) {
    var columnId, rowId, tableId,
      _this = this;

    tableId = this.table.tableId;
    if (column.parents().length > 0) {
      rowId = column.parents().attr('data-id').split('.')[2];
    }
    columnId = column.attr('data-column');
    input.on('keydown', function(event) {
      var nextColumn, nextRow, prevColumn, prevRow, value;

      if (event.which === 9) {
        event.preventDefault();
        value = input.val();
        _this.applicationGridService.updateColumn(tableId, rowId, columnId, value);
        input.replaceWith($('<span></span>').text(value));
        if (event.shiftKey === true) {
          _this.table._editPreviousCell(column);
        } else {
          _this.table._editNextCell(column);
        }
      }
      if (event.which === 13) {
        input.replaceWith($('<span></span>').text(input.val()));
        value = input.val();
        _this.applicationGridService.updateColumn(tableId, rowId, columnId, value);
        if (event.shiftKey === true) {
          prevRow = $(column.parent().prev());
          prevColumn = prevRow.find('td[data-column="' + column.attr('data-column') + '"]');
          return _this.table._editCell(prevColumn);
        } else {
          nextRow = $(column.parent().next());
          nextColumn = nextRow.find('td[data-column="' + column.attr('data-column') + '"]');
          return _this.table._editCell(nextColumn);
        }
      }
    });
    return input.on('blur', function() {
      var value;

      value = input.val();
      _this.applicationGridService.updateColumn(tableId, rowId, columnId, value);
      return input.replaceWith($('<span></span>').text(input.val()));
    });
  };

  return ExcelMoveMode;

})();

MoveModeFactory = (function() {
  function MoveModeFactory() {}

  MoveModeFactory.classes = {
    excel: ExcelMoveMode,
    sequence: SequenceMoveMode
  };

  MoveModeFactory.create = function(name) {
    return new this.classes[name];
  };

  return MoveModeFactory;

})();

SequenceMoveMode = (function() {
  function SequenceMoveMode() {}

  SequenceMoveMode.prototype.move = function(input, column, table) {
    var _this = this;

    input.on('keypress', function(event) {
      if (event.which === 13) {
        input.replaceWith($('<span></span>').text(input.val()));
        if (column.next().length === 0) {
          return table._editCell($(column.parent().next().find('td')[0]));
        } else {
          return table._editCell(column.next());
        }
      }
    });
    return input.on('blur', function() {
      return input.replaceWith($('<span></span>').text(input.val()));
    });
  };

  return SequenceMoveMode;

})();
