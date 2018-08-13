# -*- coding: utf-8 -*-
from odoo import http
from odoo import models, fields, osv

class StockD3(http.Controller):

     @http.route('/stock_d3chart', auth='public', website=True)
     def object(self, id):
        return http.request.render('stock_d3chart.index', {
            'lots': http.request.env['stock.production.lot'].sudo().search([('id','=',id)])
        })
