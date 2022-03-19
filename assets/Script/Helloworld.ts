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

            let bgMaxRect = this.getBgMaxRect();
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
            this.supplyBg(bgMaxRect, viewMaxRect, Direction.up);
            this.supplyBg(bgMaxRect, viewMaxRect, Direction.down);
            this.supplyBg(bgMaxRect, viewMaxRect, Direction.left);
            this.supplyBg(bgMaxRect, viewMaxRect, Direction.right);

            // cc.warn("diff right: ", maxRect.right, viewMaxRect.right,
            //     Math.abs(maxRect.right-viewMaxRect.right));
        }
    }

    private supplyBg(bgMaxRect: MaxRect, viewMaxRect: MaxRect, direction: Direction){
        let bgValue = this.getValue(bgMaxRect, direction);
        let viewValue = this.getValue(viewMaxRect, direction);
        let diffValue = Math.abs(bgValue-viewValue);
        cc.warn(direction, "diff: ", bgValue, viewValue, diffValue);
        if(diffValue <= 50){
            let idleBg = this.getIdleBg();
            let usedBg = this.getUsedBg();
            let newPos = this.newPos(usedBg, direction);
            cc.warn(idleBg.name, "set new pos");
            idleBg.setPos(newPos);
        }
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
        let bgArr: BgObject[] = this.bgObjArr.filter(bgObj => bgObj.isIdle());
        if(!bgArr || bgArr.length <= 0){
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

    private getBgMaxRect(){
        let maxUp = 0;
        let maxDown = 0;
        let maxLeft = 0;
        let maxRight = 0;
        this.bgObjArr.forEach((bgObj, i) => {
            let bgMaxRect = bgObj.getMaxRect();
            let up = bgMaxRect.up;
            if(up > maxUp){
                maxUp = up;
            }

            let down = bgMaxRect.down;
            if(down < maxDown){
                maxDown = down;
            }

            let left = bgMaxRect.left;
            if(left < maxLeft){
                maxLeft = left;
            }

            let right = bgMaxRect.right;
            if(right > maxRight){
                maxRight = right;
            }

            // cc.warn("\n");
            // cc.warn("maxRect", i, up, down, left, right);
        });
        return {up: maxUp, down: maxDown, left: maxLeft, right: maxRight};
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
