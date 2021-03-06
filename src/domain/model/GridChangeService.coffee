class GridChangeService
    change: (gridId, page, rowsPerGrid, filter)->
        throw new Error('Grid ID is required') unless gridId
        throw new Error('Page is required') unless page
        throw new Error('Rows Per Grid is required') unless rowsPerGrid

        DomainRegistry.gridRepository().gridOfId gridId, (error, grid)->
            throw new Error(error) if error
            return if grid is null

            condition = {
                gridId: grid.id
                page: page
                rowsPerGrid: rowsPerGrid
                filter: filter
            }

            DomainRegistry.rowRepository().rowsSpecifiedBy condition, (error, response)->
                throw new Error(error) if error
                filter = JSON.parse(condition.filter) unless condition.filter is undefined
                grid.change(response.rows, condition.page, response.total, condition.rowsPerGrid, filter)

        null
