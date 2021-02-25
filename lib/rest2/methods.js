'use strict'

/**
 * RESTv2 mock server method definition
 *
 * @constant
 * @readonly
 * @private
 */
const RESTV2_MOCK_METHODS = {
  '/v2/ticker/:symbol': 'ticker.{symbol}',
  '/v2/tickers': 'tickers',
  '/v2/tickers/hist': 'tickers_hist',
  '/v2/stats1/:key/:context': 'stats.{key}.{context}',
  '/v2/status/:type': 'status_messages.{type}.{keys}',
  '/v2/candles/:key/:section': 'candles.{key}.{section}',
  '/v2/conf/pub([:])map([:])currency([:])tx([:])fee\*': 'map_ccy_fees', // eslint-disable-line
  '/v2/conf/pub([:])map([:])pair([:])sym\*': 'map_symbols', // eslint-disable-line
  '/v2/conf/pub([:])list([:])currency([:])inactive\*': 'inactive_currencies', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])exchange([:])inactive\*': 'inactive_symbols', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])exchange\*': 'symbols', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])futures\*': 'futures', // eslint-disable-line
  '/v2/conf/pub([:])list([:])pair([:])margin\*': 'margins', // eslint-disable-line
  '/v2/conf/pub([:])list([:])currency\*': 'currencies', // eslint-disable-line
  '/v2/conf/pub([:])info([:])pair\*': 'info_pairs', // eslint-disable-line
  '/v2/trades/:symbol/hist': 'public_trades.{symbol}.{start}.{end}.{limit}.{sort}',
  '/v2/liquidations/hist': 'liquidations.{start}.{end}.{limit}.{sort}',
  '/v2/pulse/profile/:nickname': 'public_pulse_profile.{nickname}',
  '/v2/pulse/hist': 'public_pulse_hist',
  '/v2/calc/trade/avg': 'market_average_price.{symbol}.{amount}',

  '/v2/auth/r/alerts': 'alerts.{type}',
  '/v2/auth/w/alert/set': 'alert_set.{type}.{symbol}.{price}',
  '/v2/auth/w/alert/del': 'alert_del.{symbol}.{price}',
  '/v2/auth/w/deriv/collateral/set': 'derivs_pos_col_set.{symbol}.{collateral}',
  '/v2/auth/r/trades/hist': 'trades.{start}.{end}.{limit}.{sort}',
  '/v2/auth/r/trades/:symbol/hist': 'trades.{symbol}.{start}.{end}.{limit}.{sort}',
  '/v2/auth/r/wallets': 'wallets',
  '/v2/auth/r/logins/hist': 'logins_hist.{start}.{end}.{limit}',
  '/v2/auth/r/audit/hist': 'change_log.{start}.{end}.{limit}',
  '/v2/auth/r/wallets/hist': 'wallets_hist.{end}.{currency}',
  '/v2/auth/r/orders': 'active_orders',
  '/v2/auth/r/orders/hist': 'orders.{start}.{end}.{limit}',
  '/v2/auth/r/orders/:symbol/hist': 'orders.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/order/:symID/trades': 'order_trades.{symID}.{start}.{end}.{limit}',
  '/v2/auth/r/positions': 'positions',
  '/v2/auth/r/positions/hist': 'positions_hist.{start}.{end}.{limit}',
  '/v2/auth/r/positions/snap': 'positions_snap.{start}.{end}.{limit}',
  '/v2/auth/r/positions/audit': 'positions_audit.{id}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/offers/hist': 'f_offer_hist.{start}.{end}.{limit}',
  '/v2/auth/r/funding/offers/:symbol': 'f_offers.{symbol}',
  '/v2/auth/r/funding/offers/:symbol/hist': 'f_offer_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/loans/hist': 'f_loan_hist.{start}.{end}.{limit}',
  '/v2/auth/r/funding/loans/:symbol': 'f_loans.{symbol}',
  '/v2/auth/r/funding/loans/:symbol/hist': 'f_loan_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/credits/hist': 'f_credit_hist.{start}.{end}.{limit}',
  '/v2/auth/r/funding/credits/:symbol': 'f_credits.{symbol}',
  '/v2/auth/r/funding/credits/:symbol/hist': 'f_credit_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/trades/:symbol/hist': 'f_trade_hist.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/funding/trades/hist': 'f_trade_hist.{start}.{end}.{limit}',
  '/v2/auth/r/info/margin/:key': 'margin_info.{key}',
  '/v2/auth/r/info/funding/:key': 'f_info.{key}',
  '/v2/auth/r/stats/perf:1D/hist': 'performance',
  '/v2/auth/calc/order/avail': 'calc.{symbol}.{dir}.{rate}.{type}',
  '/v2/auth/r/ledgers/:symbol/hist': 'ledgers.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/ledgers/hist': 'ledgers',
  '/v2/auth/r/movements/:symbol/hist': 'movements.{symbol}.{start}.{end}.{limit}',
  '/v2/auth/r/movements/hist': 'movements',
  '/v2/auth/r/info/user': 'user_info',
  '/v2/auth/r/summary': 'account_summary',
  '/v2/auth/r/permissions': 'auth_permissions',
  '/v2/auth/w/pulse/add': 'add_pulse.{title}.{content}',
  '/v2/auth/w/pulse/del': 'delete_pulse.{pid}',
  '/v2/auth/r/pulse/hist': 'pulse_hist.{isPublic}',
  '/v2/auth/w/deposit/invoice': 'generate_invoice.{currency}.{wallet}.{amount}',
  '/v2/auth/w/funding/keep': 'keep_funding.{type}.{id}',
  '/v2/auth/w/order/submit': 'order_submit',
  '/v2/auth/w/order/cancel/multi': 'cancel_order_multi.{id}',
  '/v2/auth/w/order/multi': 'order_multi_op.{ops}',
  '/v2/auth/w/settings/set': 'set_settings.{settings}',
  '/v2/auth/r/settings': 'get_settings.{keys}',
  '/v2/auth/w/token': 'generate_token.{ttl}.{scope}.{writePermission}.{_cust_ip}',
  '/v2/calc/fx': 'calc_fx',
  '/v2/auth/w/ext/pay/invoice/create': 'invoice_submit',
  '/v2/auth/r/ext/pay/invoices': 'invoice_list'
}

module.exports = RESTV2_MOCK_METHODS
