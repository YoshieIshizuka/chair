var AllRowsSelected, AllRowsUnselected, Column, ColumnFormat, ColumnUpdated, DomainEvent, DomainRegistry, ExcelMoveMode, Grid, GridChangeService, GridChanged, GridRepository, GridService, InMemoryRowContainer, JQueryAjaxRowRepository, MoveModeFactory, Row, RowAppended, RowRemoved, RowRepository, RowSelected, RowUnselected, SequenceMoveMode, Table, TableUIHelper, ViewController, ViewEvent, ViewFilterChanged, ViewSortChanged,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Column = (function() {
  function Column(columnId, name, formats) {
    if (formats == null) {
      formats = [];
    }
    this.id = columnId;
    this.name = name;
    this.formats = formats;
  }

  Column.prototype.format = function(columnValue) {
    var format, _i, _len, _ref;

    columnValue = this.escapeHTML(columnValue);
    _ref = this.formats;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      format = _ref[_i];
      columnValue = format.format(columnValue);
    }
    return columnValue;
  };

  Column.prototype.escapeHTML = function(string) {
    return string.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  };

  return Column;

})();

ColumnFormat = (function() {
  function ColumnFormat(formatter) {
    this.formatter = formatter;
  }

  ColumnFormat.prototype.format = function(columnValue) {
    return this.formatter(columnValue);
  };

  return ColumnFormat;

})();

DomainEvent = {
  channels: {
    '*': []
  },
  publish: function(eventName, event) {
    var eventData, subscriber, _i, _j, _len, _len1, _ref, _ref1;

    if (!(eventName in this.channels)) {
      this.channels[eventName] = [];
    }
    eventData = event.serialize();
    _ref = this.channels['*'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      subscriber = _ref[_i];
      subscriber(eventData, eventName);
    }
    _ref1 = this.channels[eventName];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      subscriber = _ref1[_j];
      subscriber(eventData, eventName);
    }
    return null;
  },
  subscribe: function(eventName, listener) {
    if (!(eventName in this.channels)) {
      this.channels[eventName] = [];
    }
    this.channels[eventName].push(listener);
    return null;
  }
};

DomainRegistry = {
  _gridRepository: null,
  _rowRepository: null,
  gridRepository: function() {
    if (this._gridRepository === null) {
      this._gridRepository = new GridRepository();
    }
    return this._gridRepository;
  },
  rowRepository: function() {
    if (!this._rowRepository) {
      throw new Error('Row Repository has not been initialized');
    }
    return this._rowRepository;
  },
  setRowRepository: function(_rowRepository) {
    this._rowRepository = _rowRepository;
  },
  gridChangeService: function() {
    return new GridChangeService();
  }
};

Grid = (function() {
  var ALL_ROWS_SELECTED, ALL_ROWS_UNSELECTED;

  ALL_ROWS_UNSELECTED = 0;

  ALL_ROWS_SELECTED = 1;

  function Grid(id, columns) {
    var column, _i, _len;

    this.id = id;
    if (!this.id) {
      throw new Error('Grid ID is required');
    }
    this._rows = {};
    this.columns = [];
    for (_i = 0, _len = columns.length; _i < _len; _i++) {
      column = columns[_i];
      this.columns.push(column);
    }
    this.selectionStatus = ALL_ROWS_UNSELECTED;
  }

  Grid.prototype.selectAllRows = function() {
    this.selectionStatus = ALL_ROWS_SELECTED;
    DomainEvent.publish('AllRowsSelected', new AllRowsSelected(this.id));
    return null;
  };

  Grid.prototype.unselectAllRows = function() {
    this.selectionStatus = ALL_ROWS_UNSELECTED;
    DomainEvent.publish('AllRowsUnselected', new AllRowsUnselected(this.id));
    return null;
  };

  Grid.prototype.append = function(row) {
    if (this._hasRow(row.id)) {
      throw new Error("Row(id:" + row.id + ") already exists in the Grid(id:" + this.id + ")");
    }
    this._addRow(row);
    return DomainEvent.publish("RowAppended", new RowAppended(this.id, row.id, row.columns));
  };

  Grid.prototype.updateColumn = function(rowId, columnId, columnValue) {
    if (this._hasRow(rowId)) {
      return this._getRow(rowId).updateColumn(columnId, columnValue, this.id);
    }
  };

  Grid.prototype.rows = function() {
    var key, row;

    return (function() {
      var _ref, _results;

      _ref = this._rows;
      _results = [];
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        row = _ref[key];
        _results.push(row);
      }
      return _results;
    }).call(this);
  };

  Grid.prototype.change = function(rows, page, total, rowsPerGrid, filter) {
    var row, _i, _len;

    this._rows = {};
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      this._addRow(row);
    }
    return DomainEvent.publish("GridChanged", new GridChanged(this.id, rows, page, total, rowsPerGrid, filter));
  };

  Grid.prototype.removeRow = function(rowId) {
    if (this._hasRow(rowId)) {
      this._getRow(rowId).remove();
      return delete this._rows[rowId];
    }
  };

  Grid.prototype.allRowSelected = function() {
    return this.selectionStatus === ALL_ROWS_SELECTED;
  };

  Grid.prototype._hasRow = function(rowId) {
    if (this._rows[rowId]) {
      return true;
    } else {
      return false;
    }
  };

  Grid.prototype._getRow = function(rowId) {
    return this._rows[rowId];
  };

  Grid.prototype._addRow = function(row) {
    this._rows[row.id] = row;
    return row.gridId = this.id;
  };

  return Grid;

})();

RowAppended = (function() {
  function RowAppended(gridId, rowId, columns) {
    var key, value;

    this.gridId = gridId;
    this.rowId = rowId;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
    if (!this.rowId) {
      throw new Error('Row ID is required');
    }
    if (!columns) {
      throw new Error('Column Values are required');
    }
    this.columns = [];
    for (key in columns) {
      value = columns[key];
      this.columns.push(value);
    }
  }

  RowAppended.prototype.serialize = function() {
    return {
      gridId: this.gridId,
      rowId: this.rowId,
      columns: this.columns
    };
  };

  return RowAppended;

})();

AllRowsSelected = (function() {
  function AllRowsSelected(gridId) {
    this.gridId = gridId;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
  }

  AllRowsSelected.prototype.serialize = function() {
    return {
      gridId: this.gridId
    };
  };

  return AllRowsSelected;

})();

AllRowsUnselected = (function() {
  function AllRowsUnselected(gridId) {
    this.gridId = gridId;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
  }

  AllRowsUnselected.prototype.serialize = function() {
    return {
      gridId: this.gridId
    };
  };

  return AllRowsUnselected;

})();

GridChanged = (function() {
  function GridChanged(gridId, rows, page, total, rowsPerGrid, filter) {
    var row, _i, _len;

    this.gridId = gridId;
    this.page = page;
    this.total = total;
    this.rowsPerGrid = rowsPerGrid;
    this.filter = filter;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
    if (!rows) {
      throw new Error('Rows are required');
    }
    this.rows = [];
    for (_i = 0, _len = rows.length; _i < _len; _i++) {
      row = rows[_i];
      this.rows.push({
        id: row.id,
        columns: row.columns,
        selected: row.selected,
        updatedColumns: row.updatedColumns
      });
    }
  }

  GridChanged.prototype.page = function() {
    return this.page;
  };

  GridChanged.prototype.total = function() {
    return this.total;
  };

  GridChanged.prototype.filter = function() {
    return this.filter;
  };

  GridChanged.prototype.serialize = function() {
    return {
      gridId: this.gridId,
      rows: this.rows,
      page: this.page,
      total: this.total,
      rowsPerGrid: this.rowsPerGrid,
      filter: this.filter
    };
  };

  return GridChanged;

})();

GridChangeService = (function() {
  function GridChangeService() {}

  GridChangeService.prototype.change = function(gridId, page, rowsPerGrid, filter) {
    if (!gridId) {
      throw new Error('Grid ID is required');
    }
    if (!page) {
      throw new Error('Page is required');
    }
    if (!rowsPerGrid) {
      throw new Error('Rows Per Grid is required');
    }
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      var condition;

      if (error) {
        throw new Error(error);
      }
      if (grid === null) {
        return;
      }
      condition = {
        gridId: grid.id,
        page: page,
        rowsPerGrid: rowsPerGrid,
        filter: filter
      };
      return DomainRegistry.rowRepository().rowsSpecifiedBy(condition, function(error, response) {
        if (error) {
          throw new Error(error);
        }
        if (condition.filter !== void 0) {
          filter = JSON.parse(condition.filter);
        }
        return grid.change(response.rows, condition.page, response.total, condition.rowsPerGrid, filter);
      });
    });
    return null;
  };

  return GridChangeService;

})();

GridRepository = (function() {
  function GridRepository(grids) {
    var grid, _i, _len;

    if (grids == null) {
      grids = [];
    }
    this.grids = {};
    for (_i = 0, _len = grids.length; _i < _len; _i++) {
      grid = grids[_i];
      this.add(grid);
    }
  }

  GridRepository.prototype.gridOfId = function(id, callback) {
    if (!this.grids[id]) {
      callback(null, null);
      return;
    }
    return callback(null, this.grids[id]);
  };

  GridRepository.prototype.add = function(grid) {
    return this.grids[grid.id] = grid;
  };

  return GridRepository;

})();

Row = (function() {
  function Row(id, columns, gridId) {
    var columnId, columnValue,
      _this = this;

    this.id = id;
    this.gridId = gridId != null ? gridId : null;
    this.columns = {};
    for (columnId in columns) {
      if (!__hasProp.call(columns, columnId)) continue;
      columnValue = columns[columnId];
      this.columns[columnId] = "" + columnValue;
    }
    this.deleted = false;
    this.selected = false;
    this.updatedColumns = [];
    DomainEvent.subscribe('AllRowsSelected', function(event) {
      if (event.gridId === _this.gridId) {
        return _this.select();
      }
    });
    DomainEvent.subscribe('AllRowsUnselected', function(event) {
      if (event.gridId === _this.gridId) {
        return _this.unselect();
      }
    });
  }

  Row.prototype.updateColumn = function(columnId, columnValue) {
    if (columnId in this.columns) {
      if (this.columns[columnId] === columnValue) {
        return null;
      } else {
        this.columns[columnId] = columnValue;
        this.updatedColumns.push(columnId);
        DomainEvent.publish('ColumnUpdated', new ColumnUpdated(this.gridId, this.id, columnId, columnValue));
      }
    }
    return null;
  };

  Row.prototype.remove = function() {
    this.deleted = true;
    DomainEvent.publish('RowRemoved', new RowRemoved(this.gridId, this.id));
    return null;
  };

  Row.prototype.select = function() {
    if (this.selected === false) {
      this.selected = true;
      DomainEvent.publish('RowSelected', new RowSelected(this.gridId, this.id));
    }
    return null;
  };

  Row.prototype.unselect = function() {
    if (this.selected === true) {
      this.selected = false;
      DomainEvent.publish('RowUnselected', new RowUnselected(this.gridId, this.id));
    }
    return null;
  };

  return Row;

})();

ColumnUpdated = (function() {
  function ColumnUpdated(gridId, rowId, columnId, columnValue) {
    this.gridId = gridId;
    this.rowId = rowId;
    this.columnId = columnId;
    this.columnValue = columnValue;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
    if (!this.rowId) {
      throw new Error('Row ID is reuqired');
    }
    if (!this.columnId) {
      throw new Error('Column ID is required');
    }
    if (this.columnValue == null) {
      throw new Error('Column Value is required');
    }
  }

  ColumnUpdated.prototype.serialize = function() {
    return {
      gridId: this.gridId,
      rowId: this.rowId,
      columnId: this.columnId,
      columnValue: this.columnValue
    };
  };

  return ColumnUpdated;

})();

RowRemoved = (function() {
  function RowRemoved(gridId, rowId) {
    this.gridId = gridId;
    this.rowId = rowId;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
    if (!this.rowId) {
      throw new Error('Row ID is required');
    }
  }

  RowRemoved.prototype.serialize = function() {
    return {
      gridId: this.gridId,
      rowId: this.rowId
    };
  };

  return RowRemoved;

})();

RowSelected = (function() {
  function RowSelected(gridId, rowId) {
    this.gridId = gridId;
    this.rowId = rowId;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
    if (!this.rowId) {
      throw new Error('Row ID is required');
    }
  }

  RowSelected.prototype.serialize = function() {
    return {
      gridId: this.gridId,
      rowId: this.rowId
    };
  };

  return RowSelected;

})();

RowUnselected = (function() {
  function RowUnselected(gridId, rowId) {
    this.gridId = gridId;
    this.rowId = rowId;
    if (!this.gridId) {
      throw new Error('Grid ID is required');
    }
    if (!this.rowId) {
      throw new Error('Row ID is required');
    }
  }

  RowUnselected.prototype.serialize = function() {
    return {
      gridId: this.gridId,
      rowId: this.rowId
    };
  };

  return RowUnselected;

})();

RowRepository = (function() {
  function RowRepository() {}

  RowRepository.prototype.add = function(row) {};

  RowRepository.prototype.rowOfId = function(gridId, rowId, callback) {};

  return RowRepository;

})();

JQueryAjaxRowRepository = (function(_super) {
  __extends(JQueryAjaxRowRepository, _super);

  function JQueryAjaxRowRepository(ajaxURL) {
    this.ajaxURL = ajaxURL;
    this.gridContainer = new InMemoryRowContainer();
  }

  JQueryAjaxRowRepository.prototype.add = function(row) {
    if (!row.id) {
      throw new Error("Row ID is not specified");
    }
    if (!row.gridId) {
      throw new Error("Grid ID is not specified");
    }
    return this.gridContainer.add(row);
  };

  JQueryAjaxRowRepository.prototype.rowOfId = function(gridId, rowId, callback) {
    var row;

    if (!gridId) {
      callback("Missing argument: gridId", null);
    }
    if (!rowId) {
      callback("Missing argument: rowId", null);
    }
    row = this.gridContainer.get(gridId, rowId);
    if (row instanceof Row) {
      return callback(null, row);
    } else {
      return callback(null, null);
    }
  };

  JQueryAjaxRowRepository.prototype.rowsSpecifiedBy = function(condition, callback) {
    var _this = this;

    return $.ajax({
      url: this.ajaxURL,
      data: {
        id: condition.gridId,
        page: condition.page,
        rowsPerGrid: condition.rowsPerGrid,
        filter: condition.filter
      },
      dataType: 'json',
      success: function(data) {
        var gridId, response, row, rowData, rows, rowsForResponse, _i, _j, _len, _len1, _ref, _ref1;

        if (typeof data !== 'object') {
          return callback("Response is not object", null);
        }
        if (!('id' in data)) {
          return callback("Invalid scheme: gridId is missing", null);
        }
        if (!('rows' in data)) {
          return callback("Invalid scheme: rows is missing", null);
        }
        if (!('total' in data)) {
          return callback("Invalid scheme: total is missing", null);
        }
        _ref = data.rows;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          if (!row.id) {
            return callback("Row id is missing: " + (JSON.stringify(row)), null);
          }
        }
        gridId = data.id;
        rows = data.rows;
        rowsForResponse = [];
        _ref1 = data.rows;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          rowData = _ref1[_j];
          _this.gridContainer.addByData(gridId, rowData);
          row = _this.gridContainer.get(gridId, rowData.id);
          rowsForResponse.push(row);
        }
        response = {
          gridId: gridId,
          rows: rowsForResponse,
          total: data.total
        };
        callback(null, response);
        return null;
      },
      error: function(xhr, status, error) {
        return callback(error, null);
      }
    });
  };

  return JQueryAjaxRowRepository;

})(RowRepository);

InMemoryRowContainer = (function() {
  function InMemoryRowContainer() {
    this.grids = {};
  }

  InMemoryRowContainer.prototype.addByData = function(gridId, rowData) {
    var columns, rowId,
      _this = this;

    if (!gridId) {
      throw new Error('Grid ID is required');
    }
    if (!(rowData instanceof Object)) {
      throw new Error('Row data must be instance of Object');
    }
    if (rowData instanceof Row) {
      throw new Error('Row data must NOT be instance of Row');
    }
    if (!rowData.id) {
      throw new Error('Row must contain "id" key');
    }
    rowId = rowData.id;
    if (this._rowExists(gridId, rowId)) {
      return;
    }
    columns = this._removeIdFromColumns(rowData, 'id');
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      var row;

      if (error) {
        throw new Error('Failed to find Grid');
      }
      if (!(grid instanceof Grid)) {
        throw new Error('Grid not found');
      }
      row = new Row(rowId, columns, gridId);
      if (grid.allRowSelected()) {
        row.selected = true;
      } else {
        row.selected = false;
      }
      return _this.add(row);
    });
    return null;
  };

  InMemoryRowContainer.prototype.add = function(row) {
    var gridId, rowId;

    if (!(row instanceof Row)) {
      throw new Error('Row must be instanceof Row');
    }
    if (!row.id) {
      throw new Error('Row ID is required');
    }
    if (!row.gridId) {
      throw new Error('Row grid ID is required');
    }
    gridId = row.gridId;
    rowId = row.id;
    if (this.grids[gridId] === void 0) {
      this.grids[gridId] = {};
    }
    this.grids[gridId][rowId] = row;
    return null;
  };

  InMemoryRowContainer.prototype.get = function(gridId, rowId) {
    if (!gridId) {
      throw new Error('Grid ID is required');
    }
    if (!rowId) {
      throw new Error('Row ID is required');
    }
    if (this._rowExists(gridId, rowId)) {
      return this.grids[gridId][rowId];
    } else {
      return null;
    }
  };

  InMemoryRowContainer.prototype._rowExists = function(gridId, rowId) {
    var _ref;

    return ((_ref = this.grids[gridId]) != null ? _ref[rowId] : void 0) != null;
  };

  InMemoryRowContainer.prototype._removeIdFromColumns = function(rowData, idKey) {
    var columns, name, value;

    columns = {};
    for (name in rowData) {
      if (!__hasProp.call(rowData, name)) continue;
      value = rowData[name];
      if (name === idKey) {

      } else {
        columns[name] = value;
      }
    }
    return columns;
  };

  return InMemoryRowContainer;

})();

GridService = (function() {
  function GridService() {}

  GridService.prototype.startup = function(gridId, columnsConfig, ajaxURL) {
    var columns, config, formats, grid, _i, _len;

    if (!gridId) {
      throw new Error('Grid ID is required');
    }
    if (!columnsConfig) {
      throw new Error('Columns Config are required');
    }
    if (!ajaxURL) {
      throw new Error('Ajax URL is required');
    }
    columnsConfig = JSON.parse(columnsConfig);
    columns = [];
    for (_i = 0, _len = columnsConfig.length; _i < _len; _i++) {
      config = columnsConfig[_i];
      formats = [];
      columns.push(new Column(config.id, config.title, formats));
    }
    grid = new Grid(gridId, columns);
    DomainRegistry.gridRepository().add(grid);
    DomainRegistry.setRowRepository(new JQueryAjaxRowRepository(ajaxURL));
    return null;
  };

  GridService.prototype.select = function(gridId, rowId) {
    DomainRegistry.rowRepository().rowOfId(gridId, rowId, function(error, row) {
      if (error) {
        throw new Error(error);
      }
      if (row === null) {
        return null;
      }
      return row.select();
    });
    return null;
  };

  GridService.prototype.unselect = function(gridId, rowId) {
    DomainRegistry.rowRepository().rowOfId(gridId, rowId, function(error, row) {
      if (error) {
        throw new Error(error);
      }
      if (row === null) {
        return null;
      }
      return row.unselect();
    });
    return null;
  };

  GridService.prototype.selectAll = function(gridId) {
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      if (error) {
        throw new Error(error);
      }
      if (grid === null) {
        return null;
      }
      return grid.selectAllRows();
    });
    return null;
  };

  GridService.prototype.unselectAll = function(gridId) {
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      if (error) {
        throw new Error(error);
      }
      if (grid === null) {
        return null;
      }
      return grid.unselectAllRows();
    });
    return null;
  };

  GridService.prototype.append = function(gridId, rowId, columnValues) {
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      if (error) {
        throw new Error(error);
      }
      if (grid === null) {
        return null;
      }
      return grid.append(new Row(rowId, columnValues));
    });
    return null;
  };

  GridService.prototype.updateColumn = function(gridId, rowId, columnId, columnValue) {
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      if (error) {
        throw new Error(error);
      }
      if (grid === null) {
        return null;
      }
      return grid.updateColumn(rowId, columnId, columnValue);
    });
    return null;
  };

  GridService.prototype.removeRow = function(gridId, rowId) {
    DomainRegistry.gridRepository().gridOfId(gridId, function(error, grid) {
      if (error) {
        throw new Error(error);
      }
      if (grid === null) {
        return null;
      }
      return grid.removeRow(rowId);
    });
    return null;
  };

  GridService.prototype.change = function(gridId, page, rowsPerGrid, filter) {
    if (!gridId) {
      throw new Error('Grid ID is required');
    }
    if (!page) {
      throw new Error('Page is required');
    }
    if (!rowsPerGrid) {
      throw new Error('Rows Per Grid is required');
    }
    DomainRegistry.gridChangeService().change(gridId, page, rowsPerGrid, filter);
    return null;
  };

  return GridService;

})();

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

ViewController = (function() {
  function ViewController(gridId, columnConfigJSON, ajaxURL, tableSelector, rowSelectedClass, moveModeName) {
    this.gridId = gridId;
    this.columnConfigJSON = columnConfigJSON;
    this.tableSelector = tableSelector;
    this.rowSelectedClass = rowSelectedClass != null ? rowSelectedClass : 'row_selected';
    this.moveModeName = moveModeName;
    this.rowModifiedClass = 'row_modified';
    this.applicationGridService = new GridService;
    this.applicationGridService.startup(this.gridId, columnConfigJSON, ajaxURL);
  }

  ViewController.prototype.startup = function(page, rowsPerGrid) {
    var moveMode,
      _this = this;

    this.page = page;
    this.rowsPerGrid = rowsPerGrid;
    moveMode = MoveModeFactory.create(this.moveModeName);
    this.table = new Table(this.gridId, $(this.tableSelector), moveMode, this.applicationGridService, this.columnConfigJSON);
    this.table.header(JSON.parse(this.columnConfigJSON));
    moveMode.init(this.table, this.applicationGridService, this.rowSelectedClass);
    this.applicationGridService.change(this.gridId, page, rowsPerGrid);
    if (!this.table.filterRowExists()) {
      this.table.setFilterRow();
    }
    DomainEvent.subscribe('GridChanged', function(event, eventName) {
      var columnId, row, _i, _j, _len, _len1, _ref, _ref1;

      _this.table.removeAllRowsWithout('filter');
      if (event.gridId === _this.gridId) {
        _ref = event.rows;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          _this.table.insert(row.columns, row.id);
          if (row.selected === true) {
            _this.table.selectRow(row.id, _this.rowSelectedClass);
          }
          _ref1 = row.updatedColumns;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            columnId = _ref1[_j];
            _this.table.addClassToColumn(_this.table.rowIdOfGlobal(row.id), columnId, 'column_modified');
          }
        }
      }
      return _this.cursor();
    });
    DomainEvent.subscribe('ColumnUpdated', function(event, eventName) {
      return _this.table.addClassToColumn(_this.table.rowIdOfGlobal(event.rowId), event.columnId, 'column_modified');
    });
    DomainEvent.subscribe('RowAppended', function(event, eventName) {
      if (event.gridId === _this.gridId) {
        return _this.table.insert(event.columns, event.rowId);
      }
    });
    DomainEvent.subscribe('RowSelected', function(event, eventName) {
      if (event.gridId === _this.gridId) {
        return _this.table.selectRow(event.rowId, _this.rowSelectedClass);
      }
    });
    DomainEvent.subscribe('RowUnselected', function(event, eventName) {
      if (event.gridId === _this.gridId) {
        return _this.table.unselectRow(event.rowId, _this.rowSelectedClass);
      }
    });
    return ViewEvent.subscribe('ViewFilterChanged', function(event, eventName) {
      return _this.applicationGridService.change(_this.gridId, _this.page, _this.rowsPerGrid, JSON.stringify(event));
    });
  };

  ViewController.prototype.add = function(rowId, values) {
    return this.applicationGridService.append(this.gridId, rowId, values);
  };

  ViewController.prototype.selectAll = function() {
    return this.applicationGridService.selectAll(this.gridId);
  };

  ViewController.prototype.unselectAll = function() {
    return this.applicationGridService.unselectAll(this.gridId);
  };

  ViewController.prototype.movePageTo = function(page) {
    this.page = page;
    return this.applicationGridService.change(this.gridId, this.page, this.rowsPerGrid);
  };

  ViewController.prototype.cursor = function(rowId) {
    if (rowId !== void 0) {
      this.table.cursorRow(rowId);
    }
    return this.table.cursorTop();
  };

  return ViewController;

})();

ViewEvent = {
  channels: {
    '*': []
  },
  publish: function(eventName, event) {
    var eventData, subscriber, _i, _j, _len, _len1, _ref, _ref1;

    if (!(eventName in this.channels)) {
      this.channels[eventName] = [];
    }
    eventData = event.serialize();
    _ref = this.channels['*'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      subscriber = _ref[_i];
      subscriber(eventData, eventName);
    }
    _ref1 = this.channels[eventName];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      subscriber = _ref1[_j];
      subscriber(eventData, eventName);
    }
    return null;
  },
  subscribe: function(eventName, listener) {
    if (!(eventName in this.channels)) {
      this.channels[eventName] = [];
    }
    this.channels[eventName].push(listener);
    return null;
  }
};
