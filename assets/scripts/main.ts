import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {

    @property({
        type: Node
    })
    public itemParentNode = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}

