import Joystick, {instance, SpeedType} from "./Joystick";

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

//最大边界的坐标值，类似cc.Rect
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

    // from joystick
    @property({
        displayName: "Move Dir",
        tooltip: "移动方向",
    })
    moveDir = cc.v2(0, 0);

    @property({
        displayName: "Speed Type",
        tooltip: "速度级别",
    })
    _speedType: SpeedType = SpeedType.STOP;

    @property(Joystick)
    joystick: Joystick = null;

    private bgObjArr: BgObject[] = new Array(4);
    private timer: number = 0;

    protected onLoad() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);

        instance.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        instance.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        instance.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
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

    onTouchStart() {}

    onTouchMove(event: cc.Event.EventTouch, data) {
        this._speedType = data.speedType;
        this.moveDir = data.moveDistance;
    }

    onTouchEnd(event: cc.Event.EventTouch, data) {
        this._speedType = data.speedType;
    }

    protected update(dt: number) {
        if (this._speedType !== SpeedType.STOP) {
            // this.roleNode.angle =
            //     cc.misc.radiansToDegrees(Math.atan2(this.moveDir.y, this.moveDir.x)) - 90;
            const oldPos = cc.v2();
            this.roleNode.getPosition(oldPos);
            // cc.warn("moveDir", this.moveDir.x, this.moveDir.y);
            const newPos = oldPos.add(this.moveDir.mul(this.speed));
            this.roleNode.setPosition(newPos);

            this.mainCamera.node.position = this.roleNode.position;
        }

        this.calcBgStatus(dt);
        this.showRectLine();
    }

    private showRectLine(){
        this.rootGrap.clear();

        this.rootGrap.lineWidth = 10;

        this.rootGrap.strokeColor = cc.Color.GREEN;
        let roleRect = this.roleNode.getBoundingBox()
        this.rootGrap.rect(roleRect.x, roleRect.y, roleRect.width, roleRect.height);
        this.rootGrap.stroke();

        this.rootGrap.strokeColor = cc.Color.RED;
        this.bgObjArr.forEach(bgObj => {
            let rect = bgObj.getRect();
            this.rootGrap.rect(rect.x, rect.y, rect.width, rect.height);
            this.rootGrap.stroke();
        });
    }

    private calcBgStatus(dt: number){
        this.timer += dt;
        if(this.timer >= 1){
            this.timer = 0;

            let viewMaxRect = Helloworld.getNodeMaxRect(this.viewNode);
            this.supplyBg(viewMaxRect, Direction.up);
            this.supplyBg(viewMaxRect, Direction.down);
            this.supplyBg(viewMaxRect, Direction.left);
            this.supplyBg(viewMaxRect, Direction.right);
        }
    }

    private supplyBg(viewMaxRect: MaxRect, direction: Direction){
        let bgMaxRect: MaxRect = this.getMaxRect();
        let bgValue = this.getValue(bgMaxRect, direction);
        let viewValue = this.getValue(viewMaxRect, direction);
        let diffValue = this.calcDiff(bgValue, viewValue);
        // cc.warn(direction, "diff: ", bgValue, viewValue, diffValue);
        if(diffValue != undefined && diffValue <= 500){
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
        // return Math.abs(a+b);
        return undefined;
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
