const {ccclass, property} = cc._decorator;

enum Direction{
    up,
    down,
    left,
    right,
}

class BgObject{
    name: string;
    private bgNode: cc.Node;
    private viewNode: cc.Node;
    constructor(name: string, bgNode: cc.Node, viewNode: cc.Node) {
        this.name = name;
        this.bgNode = bgNode;
        this.viewNode = viewNode;
    }
    isIdle(): boolean{
        return !this.isUsed();
    }
    isUsed(): boolean{
        return this.getRect().intersects(this.viewNode.getBoundingBox());
    }
    getRect(): cc.Rect{
        return this.bgNode.getBoundingBox();
    }
    getPos(): cc.Vec3{
        return this.bgNode.position;
    }
    setPos(position: cc.Vec3){
        this.bgNode.position = position;
    }
    getMaxRect(): MaxRect{
        return Helloworld.getNodeMaxRect(this.bgNode);
    }
}

class MaxRect{
    up: number;
    down: number;
    left: number;
    right: number;
}

@ccclass
export default class Helloworld extends cc.Component {

    @property(cc.Camera)
    mainCamera: cc.Camera = null;

    @property([cc.Sprite])
    bgArr: Array<cc.Sprite> = [];

    @property(cc.Node)
    viewNode: cc.Node = null;

    @property(cc.Node)
    roleNode: cc.Node = null;

    @property(cc.Integer)
    speed = 10;

    @property(cc.Graphics)
    rootGrap: cc.Graphics = null;

    private bgObjArr: BgObject[] = new Array(4);
    private timer: number = 0;

    protected onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    protected onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start () {
        cc.log("speed", this.speed);

        this.bgArr.forEach((bg, i) => {
            let bgNode = this.bgArr[i].node;
            this.bgObjArr[i] = new BgObject((i+1)+"", bgNode, this.roleNode);
        });
    }

    protected update(dt: number) {
        this.mainCamera.node.position = this.roleNode.position;
        this.calcBgStatus(dt);

        this.rootGrap.clear();

        this.rootGrap.strokeColor = cc.Color.RED;
        this.rootGrap.rect(this.roleNode.position.x-50, this.roleNode.position.y-50,
            this.roleNode.getContentSize().width, this.roleNode.getContentSize().height);
        this.rootGrap.lineWidth = 10;
        this.rootGrap.stroke();

        this.bgObjArr.forEach(bgObj => {
            let rect = bgObj.getRect();
            this.rootGrap.rect(rect.x, rect.y, rect.width, rect.height);
            this.rootGrap.stroke();
        });
    }

    private calcBgStatus(dt: number){
        this.timer += dt;
        if(this.timer >= 5){
            this.timer = 0;

            // let wPos: cc.Vec3 = this.roleNode.convertToWorldSpaceAR(cc.Vec3.ZERO);
            // let cPos: cc.Vec3 = this.roleNode.position;
            // cc.log("world: ", wPos.x, wPos.y);
            // cc.log("cocos: ", cPos.x, cPos.y);

            // let viewRect = this.roleNode.getBoundingBox()
            this.bgObjArr.forEach((bgObj, i) => {
                // cc.warn("\n");
                // cc.warn("intersects", i, bgObj.isUsed());
                // cc.warn("containsRt", i, bgObj.rect.containsRect(viewRect));
            });

            let viewMaxRect = Helloworld.getNodeMaxRect(this.viewNode);
            // cc.warn("diff up: ", maxRect.up, viewMaxRect.up,
            //     Math.abs(maxRect.up-viewMaxRect.up));
            // cc.warn("diff down: ", maxRect.down, viewMaxRect.down,
            //     Math.abs(maxRect.down-viewMaxRect.down));

            // let diffLeft = Math.abs(maxRect.left-viewMaxRect.left);
            // cc.warn("diff left: ", maxRect.left, viewMaxRect.left, diffLeft);
            // if(diffLeft <= 50){
            //     let idleBg = this.getIdleBg();
            //     let usedBg = this.getUsedBg();
            //     let usedPos = usedBg.getPos();
            //     let newPos = cc.v3(usedPos.x-1024, usedPos.y, usedPos.z);
            //     cc.warn(idleBg.name, "set new pos");
            //     idleBg.setPos(newPos);
            // }
            this.supplyBg(viewMaxRect, Direction.up);
            this.supplyBg(viewMaxRect, Direction.down);
            this.supplyBg(viewMaxRect, Direction.left);
            this.supplyBg(viewMaxRect, Direction.right);

            // cc.warn("diff right: ", maxRect.right, viewMaxRect.right,
            //     Math.abs(maxRect.right-viewMaxRect.right));
        }
    }

    private supplyBg(viewMaxRect: MaxRect, direction: Direction){
        let bgMaxRect: MaxRect = this.getMaxRect();
        let bgValue = this.getValue(bgMaxRect, direction);
        let viewValue = this.getValue(viewMaxRect, direction);
        let diffValue = this.calcDiff(bgValue, viewValue);
        cc.warn(direction, "diff: ", bgValue, viewValue, diffValue);
        if(diffValue <= 50){
            this.bgObjArr.forEach(bgObj => {
                let pos = bgObj.getPos();
                switch (direction){
                    case Direction.up:
                        bgObj.setPos(cc.v3(pos.x, pos.y+1024, pos.z));
                        break;
                    case Direction.down:
                        bgObj.setPos(cc.v3(pos.x, pos.y-1024, pos.z));
                        break;
                    case Direction.left:
                        bgObj.setPos(cc.v3(pos.x-1024, pos.y, pos.z));
                        break;
                    case Direction.right:
                        bgObj.setPos(cc.v3(pos.x+1024, pos.y, pos.z));
                        break;
                }
            });
            this.bgMaxRect = null; //重置为null令其重新计算后缓存起来
        }
    }

    private calcDiff(a: number, b:number){
        if((a >= 0 && b >= 0) || (a < 0 && b < 0)){
            return Math.abs(a-b);
        }
        return Math.abs(a+b);
    }

    private getValue(maxRect: MaxRect, direction: Direction){
        switch (direction){
            case Direction.up:
                return maxRect.up;
            case Direction.down:
                return maxRect.down;
            case Direction.left:
                return maxRect.left;
            case Direction.right:
                return maxRect.right;
        }
    }

    private newPos(usedBg: BgObject, direction: Direction){
        let usedPos = usedBg.getPos();
        switch (direction){
            case Direction.up:
                return cc.v3(usedPos.x, usedPos.y+1024, usedPos.z);
            case Direction.down:
                return cc.v3(usedPos.x, usedPos.y-1024, usedPos.z);
            case Direction.left:
                return cc.v3(usedPos.x-1024, usedPos.y, usedPos.z);
            case Direction.right:
                return cc.v3(usedPos.x+1024, usedPos.y, usedPos.z);
        }
    }

    private getIdleBg(): BgObject{
        let bgArr = [];
        for(let i=0;i<this.bgObjArr.length;i++){
            if(this.bgObjArr[i].isIdle()){
                let idle = this.bgObjArr.splice(i,1)[0];
                bgArr.push(idle);
                this.bgObjArr.push(idle); //前面删除后，放到末尾
            }
        }

        if(bgArr.length <= 0){
            return null;
        }
        // cc.warn("idleBgArr: ", bgArr);
        return bgArr[0];
    }

    private getUsedBg(): BgObject{
        let bgArr: BgObject[] = this.bgObjArr.filter(bgObj => bgObj.isUsed());
        if(!bgArr || bgArr.length <= 0){
            return null;
        }
        // cc.warn("usedBgArr: ", bgArr);
        return bgArr[0];
    }

    private bgMaxRect: MaxRect = null;

    private getMaxRect(){
        if(this.bgMaxRect){
            return this.bgMaxRect;
        }

        let upArr: number[] = [];
        let downArr = [];
        let leftArr = [];
        let rightArr = [];
        this.bgObjArr.forEach(bgObj => {
            let maxRect = bgObj.getMaxRect();
            upArr.push(maxRect.up);
            downArr.push(maxRect.down);
            leftArr.push(maxRect.left);
            rightArr.push(maxRect.right);
        });
        return this.bgMaxRect = {
            up: Math.max(...upArr),
            down: Math.min(...downArr),
            left: Math.min(...leftArr),
            right: Math.max(...rightArr),
        };
    }

    static getNodeMaxRect(node: cc.Node){
        let rect = node.getBoundingBox();
        return {
            up: rect.yMax,
            down: rect.yMin,
            left: rect.xMin,
            right: rect.xMax,
        }
    }

    private onKeyDown(event){
        switch(event.keyCode) {
            case cc.macro.KEY.up:
                this.roleNode.y += this.speed;
                break;
            case cc.macro.KEY.down:
                this.roleNode.y -= this.speed;
                break;
            case cc.macro.KEY.left:
                this.roleNode.x -= this.speed;
                break;
            case cc.macro.KEY.right:
                this.roleNode.x += this.speed;
                break;
        }
    }

}
