/**
 * User: caolvchong@gmail.com
 * Date: 10/12/12
 * Time: 11:42 AM
 */
define(function(require, exports, module) {
    var $ = require('$');
    var Widget = require('../widget');
    var ajax = require('../../util/ajax');

    var helper = {
        tpl: function(url, page) {
            var html = '<a href="' + (url + page) + '" data-page="' + page + '" data-action="page">' + page + '</a>';
            return html;
        }
    };

    var Pagination = Widget.extend({
        attrs: {
            url: '', // 获取数据的URL
            type: 'ajax',
            data: null, // 提供data数组，则使用静态数据(静态分页)
            before: null, // ajax请求前的回调
            success: null, // 点击分页后的回调,ajax则为成功之后
            error: null, // ajax请求失败后的回调
            pageName: 'page', // 传递给后端的页数参数名
            sizeName: 'pagesize', // 传递给后端的每页数量参数名
            totalName: 'data.total', // 后端返回总条数的参数名
            size: 12, // 每页数量
            current: { // 当前页
                value: 1,
                setter: function(val) {
                    var totalPage = Math.ceil(this.get('total') / this.get('size'));
                    return Math.min(Math.max(val, 1), totalPage);
                }
            },
            total: 0, // 数据总数
            template: '<div class="widget-pagination"></div>'
        },
        events: {
            'click [data-action=prev]': function(e) { // 上一页事件
                if(this.get('type') !== 'link') {
                    if(!$(e.target).hasClass('disabled')) {
                        this.prev();
                    }
                    e.preventDefault();
                }
            },
            'click [data-action=page]': function(e) { // 某一页事件
                if(this.get('type') !== 'link') {
                    this.load($(e.target).attr('data-page'));
                    e.preventDefault();
                }
            },
            'click [data-action=next]': function(e) { // 下一页事件
                if(this.get('type') !== 'link') {
                    if(!$(e.target).hasClass('disabled')) {
                        this.next();
                    }
                    e.preventDefault();
                }
            }
        },
        prev: function() {
            this.set('current', Math.max(1, this.get('current') - 1));
            return this;
        },
        next: function() {
            var totalPage = Math.ceil(this.get('total') / this.get('size'));
            this.set('current', Math.min(totalPage, this.get('current') + 1));
            return this;
        },
        load: function(val) {
            this.set('current', +val);
            return this;
        },
        /**
         * 视图，自定义显示的话需要重写此方法
         */
        view: function(flag) {
            var url = this.get('url');
            var x = this.get('x') || 2; // 当前页码附近显示页数
            var y = this.get('y') || 1; // 省略号附近显示页数
            var totalPage = Math.ceil(this.get('total') / this.get('size')); // 总页数
            var current = this.get('current'); // 当前页
            var sizeName = this.get('sizeName');
            var pageName = this.get('pageName');
            var html = [];
            var pn = ['', ''];
            var split = '<span>...</span>';
            url += url.indexOf('?') === -1 ? '?' : '&';
            if(url.indexOf(sizeName + '=') == -1) {
                url += sizeName + '=' + this.get('size') + '&';
            }
            if(url.indexOf(pageName + '=') == -1) {
                url += pageName + '=';
            }
            if(this.get('showPN') !== false) {
                pn[0] = '<a href="' + (url + Math.max(1, current - 1)) + '" data-action="prev">上一页</a>';
                pn[1] = '<a href="' + (url + Math.min(totalPage, current + 1)) + '" data-action="next">下一页</a>';
            }
            if(totalPage <= 5) {
                for(var i = 1; i <= totalPage; i++) {
                    html.push(helper.tpl(url, i));
                }
            } else {
                if(current <= 3) {
                    for(var i = 1; i <= 4; i++) {
                        html.push(helper.tpl(url, i));
                    }
                    html.push(split, helper.tpl(url, totalPage));
                } else if(current >= totalPage - 2) {
                    html.push(helper.tpl(url, 1), split);
                    for(var i = totalPage - 2; i <= totalPage; i++) {
                        html.push(helper.tpl(url, i));
                    }
                } else {
                    html.push(helper.tpl(url, 1), split, helper.tpl(url, current - 1), helper.tpl(url, current), helper.tpl(url, current + 1), split, helper.tpl(url, totalPage));
                }
            }
            this.element.html(pn[0] + html.join('') + pn[1]);
            this.reflow();
            if(flag !== false && this.get('type') === 'ajax') {
                this._ajax();
            } else {
                this.get('success') && this.get('success').call(this, current);
            }
            return this;
        },
        reflow: function() {
            var current = this.get('current');
            var totalPage = Math.ceil(this.get('total') / this.get('size'));
            this.$('[data-action=prev]').toggleClass('disabled', current <= 1);
            this.$('[data-action=next]').toggleClass('disabled', current >= totalPage);
            this.$('[data-page]').removeClass('active');
            this.$('[data-page=' + current + ']').addClass('active');
            return this;
        },
        _ajax: function() {
            var that = this;
            var sa = ajax.single(this.cid);
            var data = {};
            var list = ['before', 'error', 'complete'];
            var obj = {
                url: this.get('url'),
                data: data,
                success: function(data) {
                    var totalName = that.get('totalName').split('.');
                    var total = data;
                    var prev = +that.get('total');
                    var size = that.get('size');
                    var current = that.get('current');
                    for(var i = 0, len = totalName.length; i < len; i++) {
                        total = total[totalName[i]];
                    }
                    total = +total;
                    if(prev !== total) {
                        var totalPage = Math.ceil(total / size);
                        that.set('total', total, {silent: true});
                        if(current > totalPage) {
                            that.set('current', totalPage);
                        } else {
                            that.view(false);
                        }
                    }
                    that.get('success') && that.get('success').call(that, that.get('current'));
                }
            };
            data[this.get('pageName')] = this.get('current');
            data[this.get('sizeName')] = this.get('size');

            for(var i = 0, len = list.length; i < len; i++) {
                var key = list[i];
                if(that.get(key)) {
                    obj[key] = that.get(key).call(that);
                }
            }

            return sa.send(obj);
        },
        _onRenderCurrent: function(val, prev) {
            this.view();
        },
        _onRenderTotal: function(val, prev) {
            this.view();
        }
    });

    return Pagination;
});