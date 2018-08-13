# -*- coding: utf-8 -*-

from odoo import models, fields, api

class button_action(models.Model):
    _name = "stock.production.lot"
    _inherit = "stock.production.lot"

    def show_lot(self):
        data = self.read()
        id = data[0]['id']

        return {
            'type': 'ir.actions.act_url',
            'target': 'new',
            'url': '/stock_d3chart?id=' + str(id)
        }
