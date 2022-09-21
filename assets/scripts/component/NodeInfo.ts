import { _decorator, Component, Node, tween, Sprite, Color, log, Label, Layers, color, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

export enum NodeStates {
    Alive,
    Dead
}

@ccclass('NodeInfo')
export class NodeInfo extends Component {

    public x:number;
    public y:number;
    public r:number;
    public c:number;
    public type:number;
    public layer:number;

    public state:NodeStates = NodeStates.Alive;
    public hidden:boolean = false;

    start() {
        let node = new Node();
        node.layer = 1 << 25;    // UI_2D
        this.node.addChild(node);
        let label = node.addComponent(Label);
        // let key = `(${this.x},${this.y})`;
        let key = `${this.type}`;
        label.string = key;
        label.fontSize = 18;
        node.active = false;
    }

    update(deltaTime: number) {
        
    }

    /**
     * 刷新遮挡表现
     * @param time 
     * @param allData 
     */
    refreshCoverState(time:number, allData:Array<Array<[number, number, number, number, number]>>){
        // 检查上方的层
        let findFlag = false;
        for (let i = this.layer + 1; i <= 3; i += 1) {
            let data = allData[i];
            findFlag = findFlag || data.some(value => {
                let x = value[0];
                let y = value[1];
                // 计算覆盖的范围
                let x1 = x;
                let x2 = x + 1;
                let y1 = y;
                let y2 = y + 1;
                let keySet:Set<string> = new Set<string>();

                keySet.add(`${x1}-${y1}`);
                keySet.add(`${x1}-${y2}`);
                keySet.add(`${x2}-${y1}`);
                keySet.add(`${x2}-${y2}`);

                x = this.x;
                y = this.y;
                x1 = x;
                x2 = x + 1;
                y1 = y;
                y2 = y + 1;

                let key1 = `${x1}-${y1}`;
                let key2 = `${x1}-${y2}`;
                let key3 = `${x2}-${y1}`;
                let key4 = `${x2}-${y2}`;


                if (keySet.has(key1) || keySet.has(key2) || keySet.has(key3) || keySet.has(key4)) {
                    findFlag = true;
                    return true;
                }
            });
            if (findFlag) {
                break;
            }
        }
        this.hidden = findFlag;
        if (findFlag) {
            // 有遮挡
            tween(this.node.children[0].getComponent(UIOpacity)).to(time, {
                opacity: 100
            }).start();
        } else {
            tween(this.node.children[0].getComponent(UIOpacity)).to(time, {
                opacity: 0
            }).start();
        }
    }
}

