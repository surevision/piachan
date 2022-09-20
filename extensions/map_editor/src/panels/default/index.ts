import { readFileSync } from 'fs-extra';
import { join } from 'path';
import Vue from 'vue/dist/vue';
import MapData from '../../obj/MapData';
const component = Vue.extend({
    template: readFileSync(join(__dirname, '../../../static/template/vue/app.html'), 'utf-8'),
    
    data() {
        return {
            mapData: new MapData(),
            mapStr: ""
        };
    },
    mounted() {
        this.initCanvas();
    },
    methods: {
        _getCtx(): CanvasRenderingContext2D | null {
            const canvas = this.$el.getElementsByClassName("canvas")[0] as HTMLCanvasElement;
            const ctx = canvas.getContext("2d");
            return ctx;
        },
        drawLines() {
            const row = 7;
            const col = 7;
            const width = 448;
            const height = 448;
            const pad = width / row;
            // 画线
            const ctx = this._getCtx();
            for (let i = 0; i <= col * 2; i += 1) {
                let x = i * (pad / 2);
                ctx?.beginPath();
                ctx?.moveTo(x, 0);
                ctx?.lineTo(x, height);
                ctx?.setLineDash([]);
                ctx!.lineWidth = 2;
                if (i == 0 || i == col * 2) {
                    ctx!.lineWidth = 4;
                }
                if (i % 2 == 1) {
                    // 虚线
                    ctx?.setLineDash([5,5]);
                }
                ctx?.stroke();
            }
            for (let j = 0; j <= row * 2; j += 1) {
                let y = j * (pad / 2);
                ctx?.beginPath();
                ctx?.moveTo(0, y);
                ctx?.lineTo(width, y);
                ctx?.setLineDash([]);
                ctx!.lineWidth = 2;
                if (j == 0 || j == row * 2) {
                    ctx!.lineWidth = 4;
                }
                if (j % 2 == 1) {
                    // 虚线
                    ctx?.setLineDash([5,5]);
                }
                ctx?.stroke();
            }
        },
        initCanvas() {
            this.clearCanvas();
            this.drawLines();
        },
        clearCanvas() {
            const ctx = this._getCtx();
            const width = 448;
            const height = 448;
            ctx?.clearRect(0, 0, width, height);

        },
        drawSelected() {
            const row = 7;
            const col = 7;
            const width = 448;
            const height = 448;
            const pad = width / row;
            const ctx = this._getCtx();
            ctx!.fillStyle = "#33ff33";
            console.log("Data");
            console.log(JSON.stringify(this.mapData.data));
            Object.keys(this.mapData.data).forEach(k => {
                let value = this.mapData.data[k];
                let xIndex = value[0];
                let yIndex = value[1];
                let x = xIndex * (pad / 2);
                let y = yIndex * (pad / 2);
                ctx?.fillRect(x, y, pad, pad);
                ctx?.fill();
            });
        },
        clickCanvas(e:MouseEvent) {
            const row = 7;
            const col = 7;
            const width = 448;
            const height = 448;
            const pad = width / row;
            let offsetX = e.offsetX;
            let offsetY = e.offsetY;
            // 小格子
            let xIndex = Math.floor(offsetX / (pad / 2));
            let yIndex = Math.floor(offsetY / (pad / 2));
            // 大格子
            let c = Math.floor(offsetX / (pad / 1));
            let r = Math.floor(offsetY / (pad / 1));
            console.log(JSON.stringify([xIndex, yIndex, r, c, e.button]));
            this.dealPos(xIndex, yIndex, r, c, e.button);
            this.clearCanvas();
            this.drawSelected();
            this.drawLines();
        },
        dealPos(x:number, y:number, r:number, c:number, button:number) {
            const row = 7;
            const col = 7;
            // 计算覆盖的范围
            let x1 = x;
            let x2 = x + 1;
            let y1 = y;
            let y2 = y + 1;
            let key1 = `${Math.floor(x1 / 2)}-${Math.floor(y1 / 2)}`;
            let key2 = `${Math.floor(x1 / 2)}-${Math.floor(y2 / 2)}`;
            let key3 = `${Math.floor(x2 / 2)}-${Math.floor(y1 / 2)}`;
            let key4 = `${Math.floor(x2 / 2)}-${Math.floor(y2 / 2)}`;

            delete this.mapData.data[key1];
            delete this.mapData.data[key2];
            delete this.mapData.data[key3];
            delete this.mapData.data[key4];

            // 插入一个新节点
            if (button == 0) {
                let value:[number, number, number, number] = [x, y, r, c];
                if (this.mapData.data[key1] == null) {
                    this.mapData.data[key1] = value;
                }
                if (this.mapData.data[key2] == null) {
                    this.mapData.data[key2] = value;
                }
                if (this.mapData.data[key3] == null) {
                    this.mapData.data[key3] = value;
                }
                if (this.mapData.data[key4] == null) {
                    this.mapData.data[key4] = value;
                }
            }
        },
        /**
         * 输出结果
         */
        generate() {
            this.mapStr = JSON.stringify(this.mapData);
            let textarea = this.$el.getElementsByTagName("textarea")[0] as HTMLTextAreaElement;
            textarea.innerText = this.mapStr;
        },
        /**
         * 编辑现有数据
         * @param data 
         */
        edit(data:string) {
            let textarea = this.$el.getElementsByTagName("textarea")[0] as HTMLTextAreaElement;
            this.mapStr = textarea.value;
            let obj = JSON.parse(this.mapStr);
            this.mapData.data = obj.data;
            this.clearCanvas();
            this.drawSelected();
            this.drawLines();
        }
    },
});
const weakMap = new WeakMap() as WeakMap<object, InstanceType<typeof component>>;
/**
 * @zh 如果希望兼容 3.3 之前的版本可以使用下方的代码
 * @en You can add the code below if you want compatibility with versions prior to 3.3
 */
// Editor.Panel.define = Editor.Panel.define || function(options: any) { return options }
module.exports = Editor.Panel.define({
    listeners: {
        show() { console.log('show'); },
        hide() { console.log('hide'); },
    },
    template: readFileSync(join(__dirname, '../../../static/template/default/index.html'), 'utf-8'),
    style: readFileSync(join(__dirname, '../../../static/style/default/index.css'), 'utf-8'),
    $: {
        app: '#app',
        text: '#text',
    },
    methods: {
        hello() {
            if (this.$.text) {
                this.$.text.innerHTML = 'hello';
                console.log('[cocos-panel-html.default]: hello');
            }
        },
    },
    ready() {
        if (this.$.text) {
            this.$.text.innerHTML = 'Hello Cocos.';
        }
        if (this.$.app) {
            const vm = new component();
            // weakMap.set(this, vm);
            vm.$mount(this.$.app);
        }
    },
    beforeClose() { },
    close() {
        const vm = weakMap.get(this);
        if (vm) {
            vm.$destroy();
        }
    },
});
