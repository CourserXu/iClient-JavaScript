import {baiduMapLayer, DataSet} from "mapv";

var BaseLayer = baiduMapLayer ? baiduMapLayer.__proto__ : Function;

/**
 * @private
 * @class MapvRenderer
 * @classdesc MapV图层渲染
 * @param map - {string} 地图
 * @param layer -{Object} 图层
 * @param dataSet -{Object} 数据集
 * @param options -{Object} 交互时所需可选参数。
 * @extends BaseLayer
 *
 */
export class MapvRenderer extends BaseLayer {
    constructor(map, layer, dataSet, options) {
        super(map, dataSet, options);
        if (!BaseLayer) {
            return;
        }
        this.map = map;
        var self = this;
        options = options || {};

        self.init(options);
        self.argCheck(options);
        this.canvasLayer = layer;
        this.clickEvent = this.clickEvent.bind(this);
        this.mousemoveEvent = this.mousemoveEvent.bind(this);
        this.map.on('move', this.moveEvent.bind(this));
        this.map.on('resize', this.resizeEvent.bind(this));
        this.map.on('moveend', this.moveEndEvent.bind(this));
        this.map.on('remove', this.removeEvent.bind(this));
        this.bindEvent();
    }

    /**
     * @function MapvRenderer.prototype.clickEvent
     * @description  点击绑定事件
     * @param e - {Object} 事件
     */
    clickEvent(e) {
        var pixel = e.point;
        super.clickEvent(pixel, e);
    }

    /**
     * @function MapvRenderer.prototype.mousemoveEvent
     * @description  鼠标移动事件
     * @param e - {Object} 事件
     */
    mousemoveEvent(e) {
        var pixel = e.point;
        super.mousemoveEvent(pixel, e);
    }

    /**
     * @function  MapvRenderer.prototype.bindEvent
     * @description 绑定事件
     */
    bindEvent() {
        var map = this.map;
        if (this.options.methods) {
            if (this.options.methods.click) {
                map.on('click', this.clickEvent);
            }
            if (this.options.methods.mousemove) {
                map.on('mousemove', this.mousemoveEvent);
            }
        }
    }

    /**
     * @function MapvRenderer.prototype.unbindEvent
     * @description 解绑事件
     */
    unbindEvent() {
        var map = this.map;

        if (this.options.methods) {
            if (this.options.methods.click) {
                map.off('click', this.clickEvent);
            }
            if (this.options.methods.mousemove) {
                map.off('mousemove', this.mousemoveEvent);
            }
        }
    }

    /**
     * @function MapvRenderer.prototype.getContext
     * @description 获取信息
     */
    getContext() {
        return this.canvasLayer.canvas.getContext(this.context);
    }

    /**
     * @function MapvRenderer.prototype.addData
     * @description 添加数据
     * @param data - {oject} 待添加的数据
     * @param options - {oject} 待添加的数据信息
     */
    addData(data, options) {
        var _data = data;
        if (data && data.get) {
            _data = data.get();
        }
        this.dataSet.add(_data);
        this.update({options: options});
    }

    /**
     * @function MapvRenderer.prototype.update
     * @description 更新图层
     * @param opt - {Object} 待更新的数据<br>
     *        data -{Object} mapv数据集<br>
     *        options -{Object} mapv绘制参数<br>
     */
    update(opt) {
        var update = opt || {};
        var _data = update.data;
        if (_data && _data.get) {
            _data = _data.get();
        }
        if (_data != undefined) {
            this.dataSet.set(_data);
        }
        super.update({options: update.options});
    }

    /**
     * @function MapvRenderer.prototype.getData
     * @description 获取数据
     */
    getData() {
        return this.dataSet;
    }

    /**
     * @function MapvRenderer.prototype.removeData
     * @description 删除符合过滤条件的数据
     * @param filter - {function} 过滤条件。条件参数为数据项，返回值为true,表示删除该元素；否则表示不删除
     */
    removeData(filter) {
        if (!this.dataSet) {
            return;
        }
        var newData = this.dataSet.get({
            filter: function (data) {
                return (filter != null && typeof filter === "function") ? !filter(data) : true;
            }
        });
        this.dataSet.set(newData);
        this.update({options: null});
    }

    /**
     * @function MapVRenderer.prototype.clearData
     * @description 清除数据
     */
    clearData() {
        this.dataSet && this.dataSet.clear();
        this.update({options: null});
    }

    /**
     * @function MapVRenderer.prototype.updateData
     * @param dataSet - {Object} 数据集
     * @param options - {Object} 数据项配置
     * @description  更新数据
     */
    updateData(dataSet, options) {
        if (dataSet && dataSet.get) {
            this.dataSet.set(dataSet.get());
        }
        this.update({options: options});
    }

    _canvasUpdate(time) {
        if (!this.canvasLayer) {
            return;
        }

        var self = this;

        var animationOptions = self.options.animation;

        var context = this.getContext();
        var map = this.map;
        if (self.isEnabledTime()) {
            if (time === undefined) {
                this.clear(context);
                return;
            }
            if (this.context === '2d') {
                context.save();
                context.globalCompositeOperation = 'destination-out';
                context.fillStyle = 'rgba(0, 0, 0, .1)';
                context.fillRect(0, 0, context.canvas.width, context.canvas.height);
                context.restore();
            }
        } else {
            this.clear(context);
        }

        if (this.context === '2d') {
            for (var key in self.options) {
                context[key] = self.options[key];
            }
        } else {
            context.clear(context.COLOR_BUFFER_BIT);
        }

        if (self.options.minZoom && map.getZoom() < self.options.minZoom || self.options.maxZoom && map.getZoom() > self.options.maxZoom) {
            return;
        }

        // function projectPoint(p) {
        //     var sin = Math.sin(p[1] * Math.PI / 180),
        //         x = (p[0] / 360 + 0.5),
        //         y = (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI);
        //
        //     y = y < 0 ? 0 :
        //         y > 1 ? 1 : y;
        //
        //     return [x, y, 0];
        // }

        var dataGetOptions = {
            transferCoordinate: function (coordinate) {
                var worldPoint = map.transform.locationPoint((new window.mapboxgl.LngLat(coordinate[0], coordinate[1])));
                return [worldPoint.x, worldPoint.y];
            }
        };

        if (time !== undefined) {
            dataGetOptions.filter = function (item) {
                var trails = animationOptions.trails || 10;
                return (time && item.time > (time - trails) && item.time < time);
            }
        }

        var data = self.dataSet.get(dataGetOptions);

        this.processData(data);

        self.options._size = self.options.size;

        var worldPoint = map.project(new window.mapboxgl.LngLat(0, 0));
        this.drawContext(context, new DataSet(data), self.options, worldPoint);

        self.options.updateCallback && self.options.updateCallback(time);
    }

    init(options) {

        var self = this;

        self.options = options;

        this.initDataRange(options);

        this.context = self.options.context || '2d';

        if (self.options.zIndex) {
            this.canvasLayer && this.canvasLayer.setZIndex(self.options.zIndex);
        }

        this.initAnimator();
    }

    /**
     * @function MapvRenderer.prototype.addAnimatorEvent
     * @description 添加动画事件
     */
    addAnimatorEvent() {

    }

    /**
     * @function MapvRenderer.prototype.removeEvent
     * @description 移除事件
     */
    removeEvent() {
        this.canvasLayer.mapContainer.removeChild(this.canvasLayer.canvas);
    }

    /**
     * @function MapvRenderer.prototype.moveEvent
     * @description 隐藏事件
     */
    moveEvent() {
        this._hide();
    }

    /**
     * @function MapvRenderer.prototype.resizeEvent
     * @description 调整事件
     */
    resizeEvent() {
        var canvas = this.canvasLayer.canvas;
        canvas.style.position = 'absolute';
        canvas.style.top = 0 + "px";
        canvas.style.left = 0 + "px";
        canvas.width = parseInt(this.map.getCanvas().style.width);
        canvas.height = parseInt(this.map.getCanvas().style.height);
        canvas.style.width = this.map.getCanvas().style.width;
        canvas.style.height = this.map.getCanvas().style.height;
    }

    /**
     * @function MapvRenderer.prototype.moveEndEvent
     * @description 移除最后事件
     */
    moveEndEvent() {
        this._canvasUpdate();
        this._show();
    }

    /**
     * @function MapvRenderer.prototype.clear
     * @param context - {object} 当前环境
     * @description 清除环境
     */
    clear(context) {
        context && context.clearRect && context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    }

    _hide() {
        this.canvasLayer.canvas.style.display = 'none';
    }

    _show() {
        this.canvasLayer.canvas.style.display = 'block';
    }

    /**
     * @function MapvRenderer.prototype.draw
     * @description 渲染绘制
     */
    draw() {
        this.canvasLayer.draw();
    }

}