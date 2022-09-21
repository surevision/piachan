import { _decorator, Component, Node, assetManager, Prefab, instantiate, find, Vec3, log, Event, tween, UITransform, Button, EventHandler } from 'cc';
import { LevelLayer } from './component/LevelLayer';
import { NodeInfo, NodeStates } from './component/NodeInfo';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {

    @property({
        type: Node
    })
    public levelNode:Node = null;

    @property({
        type: Node
    })
    public itemParentNode:Node = null;

    @property({
        type: Node
    })
    public selectedNode:Node = null;

    @property({
        type: Node
    })
    public restartNode:Node = null;

    public cardNodes:Array<NodeInfo> = [];

    /**
     * 当前关卡数据layer=>[x, y, r, c, type]
     */
    public levelData:Array<Array<[number, number, number, number, number]>> = [];

    /**
     * 已选节点[nodeInfo, type]
     */
    public selectedPool:Array<[NodeInfo, number]> = [];

    /**
     * 加载关卡
     * @param lv 
     */
    loadLevel(lv:number) {
        let row = 7;
        let width = 630;
        let pad = width / row;
        assetManager.loadBundle("resources", (err, bundle) => {
            bundle.load(`lv/lv${lv}`, Prefab, (err, prefab) => {
                let newNode = instantiate(prefab);
                this.levelNode.removeAllChildren();
                this.levelNode.addChild(newNode);
                // 根据关卡数值生成节点
                let data:Array<{[key: string]: [number, number, number, number]}> = [];
                for (let i = 0; i < 4; i += 1) {
                    let dataStr = find(`layer${i + 1}`, newNode).getComponent(LevelLayer).data;
                    // log(dataStr);
                    let layerData = JSON.parse(dataStr)["data"] as {
                        [key: string]: [number, number, number, number]
                    };
                    data.push(layerData);
                }
                let count = 0;  // 生成的图案计数
                // 计算总数
                let tmpCheckMap:{[key:string]:boolean} = {};
                let allCount = data.reduce((result, curr, index) => {
                    return result + Object.values(curr).reduce((r, c) => {
                        let key = `${index}-${c[0]}-${c[1]}`;
                        if (tmpCheckMap[key]) {
                            return r;
                        }
                        tmpCheckMap[key] = true;
                        return r + 1;
                    }, 0);
                }, 0);
                let allData:Array<number> = [];
                // 生成所有图案数据
                let types:Array<number> = [0, 1, 2, 3, 4, 5];
                for (let i = 0; i < allCount; i += 3) {
                    let index = Math.floor(Math.random() * types.length);
                    allData.push(types[index]);
                    types.splice(index, 1);
                    if (types.length == 0) {
                        types = [0, 1, 2, 3, 4, 5];
                    }
                    // 。。。。。。
                    index = Math.floor(Math.random() * types.length);
                    allData.push(types[index]);
                    types.splice(index, 1);
                    if (types.length == 0) {
                        types = [0, 1, 2, 3, 4, 5];
                    }
                    // 。。。。。。
                    index = Math.floor(Math.random() * types.length);
                    allData.push(types[index]);
                    types.splice(index, 1);
                    if (types.length == 0) {
                        types = [0, 1, 2, 3, 4, 5];
                    }
                }
                tmpCheckMap = {};
                let levelData:Array<Array<[number, number, number, number, number]>> = [];
                let levelLayerData:Array<[number, number, number, number, number]> = [];
                let nodes:Array<Node> = [];
                data.forEach((info, index) => {
                    let node = find(`layer${index + 1}`, newNode);
                    levelLayerData = [];
                    Object.values(info).forEach(value => {
                        let key = `${index}-${value[0]}-${value[1]}`;
                        if (!tmpCheckMap[key] && allData.length > 0) {
                            count += 1;
                            tmpCheckMap[key] = true;
                            // 取一个图案
                            let i = Math.floor(Math.random() * allData.length);
                            let type = allData[i];
                            allData.splice(i, 1);
                            let x = value[0];
                            let y = value[1];
                            let r = value[2];
                            let c = value[3];
                            levelLayerData.push([x, y, r, c, type]);
                            // 生成节点
                            let typeNode = instantiate(this.itemParentNode.children[type]);
                            node.addChild(typeNode);
                            let pos = new Vec3(
                                (x / 2) * pad - width / 2 + pad / 2, 
                                -width / 2 + (((row * 2 - y) / 2) * pad - pad / 2));
                            typeNode.position = pos;
                            // 绑定数据
                            let nodeInfo = typeNode.addComponent(NodeInfo);
                            nodeInfo.x = x;
                            nodeInfo.y = y;
                            nodeInfo.r = r;
                            nodeInfo.c = c;
                            nodeInfo.type = type;
                            nodeInfo.layer = index;
                            // 按钮事件
                            let eventHandler = new EventHandler();
                            eventHandler.target = this.node;
                            eventHandler.handler = "clickCard";
                            eventHandler.component = "main";
                            nodeInfo.node.getComponent(Button).clickEvents.push(eventHandler);
                            nodes.push(typeNode);
                        }
                    });
                    levelData.push(levelLayerData);
                });
                // 初始化节点渲染情况
                nodes.forEach(node => {
                    node.getComponent(NodeInfo).refreshCoverState(0, levelData);
                });
                this.cardNodes = nodes.map(n=>{return n.getComponent(NodeInfo)});
                this.levelData = levelData;
            });
        });
    }

    clickCard(e:Event, customEventData:string) {
        const width = 630;
        const col = 7;
        const pad = width / col;
        let node = e.target as Node;
        let nodeInfo = node.getComponent(NodeInfo);
        let cardType = nodeInfo.type;
        let layer = nodeInfo.layer;
        if (nodeInfo.hidden) {
            return;
        }
        if (nodeInfo.state == NodeStates.Alive) {
            nodeInfo.state = NodeStates.Dead;
            // 倒序插入到选择数组
            let index = 0;
            for (let i = 0; i < this.selectedPool.length; i += 1) {
                if (this.selectedPool[i][1] > cardType) {
                    break;
                }
                index = i + 1;
            }
            this.selectedPool.splice(index, 0, [nodeInfo, cardType]);
            let parentTransform = nodeInfo.node.parent.getComponent(UITransform);
            // 移入动效
            let targetPos = new Vec3(
                index * pad - width / 2 + pad / 2,
                0,
                nodeInfo.node.position.z
            );
            tween(nodeInfo.node).stop();
            tween(nodeInfo.node).delay(0.05).to(0.35, {
                position: parentTransform.convertToNodeSpaceAR(this.selectedNode.getComponent(UITransform).convertToWorldSpaceAR(targetPos))
            }, {
                onComplete: () => {
                    // 地图数据删除
                    for (let i = 0; i < this.levelData[layer].length; i += 1) {
                        if (this.levelData[layer][i][0] == nodeInfo.x && this.levelData[layer][i][1] == nodeInfo.y) {
                            this.levelData[layer].splice(i, 1);
                            break;
                        }
                    }
                    // 已选择数据三消
                    let cntMap:{[key:number]:number} = {};
                    for (let i = 0; i < this.selectedPool.length; i += 1) {
                        if (!cntMap[this.selectedPool[i][1]]) {
                            cntMap[this.selectedPool[i][1]] = 1;
                        } else {
                            cntMap[this.selectedPool[i][1]] += 1;
                        }
                        if (cntMap[this.selectedPool[i][1]] == 3) {
                            // 向前删除3个
                            for (let j = 0; j < 3; j += 1) {
                                // 动效
                                tween(this.selectedPool[i - 3 + 1][0].node).delay(0.1).to(0.3, {
                                    scale: new Vec3(0, 0, 1)
                                }, {
                                    onComplete: (target) => {
                                        let node = target as Node;
                                        if (j == 0) {
                                            // 后方节点前移
                                            for (let j = i + 1; j < this.selectedPool.length; j += 1) {
                                                let forwardNodeInfo = this.selectedPool[j][0];
                                                targetPos = new Vec3(
                                                    j * pad - width / 2 + pad / 2,
                                                    0,
                                                    forwardNodeInfo.node.position.z
                                                );
                                                tween(forwardNodeInfo.node).stop();
                                                tween(forwardNodeInfo.node).to(0.3, {
                                                    position: parentTransform.convertToNodeSpaceAR(this.selectedNode.getComponent(UITransform).convertToWorldSpaceAR(targetPos))
                                                }).start();
                                            }
                                        }
                                    }
                                }).start();
                                // 数据删除
                                this.selectedPool.splice(i - 3 + 1, 1);
                            }
                            i -= 3;
                            //
                        }
                    }
                    // 刷新遮挡
                    this.cardNodes.forEach(nodeInfo=>nodeInfo.refreshCoverState(0.5, this.levelData));
                    // 判定胜负
                    if (this.selectedPool.length > col) {
                        log("lose");
                        this.restartNode.active = true;
                        this.restartNode.children[0].active = false;
                        this.restartNode.children[1].active = true;
                    }
                    if (this.levelData.every(v=>v.length == 0)) {
                        log("win");
                        this.restartNode.active = true;
                        this.restartNode.children[0].active = true;
                        this.restartNode.children[1].active = false;
                    }
                }
            }).start();
            // 后退动效
            for (let i = index + 1; i < this.selectedPool.length; i += 1) {
                let forwardNodeInfo = this.selectedPool[i][0];
                targetPos = new Vec3(
                    i * pad - width / 2 + pad / 2,
                    0,
                    forwardNodeInfo.node.position.z
                );
                tween(forwardNodeInfo.node).stop();
                tween(forwardNodeInfo.node).to(0.3, {
                    position: parentTransform.convertToNodeSpaceAR(this.selectedNode.getComponent(UITransform).convertToWorldSpaceAR(targetPos))
                }).start();
            }
        }
    }

    clickRestart() {
        this.restartNode.active = false;
        this.cardNodes = [];
        this.selectedPool = [];
        this.levelData = [];
        this.levelNode.removeAllChildren();
        this.selectedNode.removeAllChildren();
        this.loadLevel(1);
    }

    start() {
        this.loadLevel(1);
    }

    update(deltaTime: number) {
        
    }
}

