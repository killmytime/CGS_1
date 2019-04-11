//该函数在一个canvas上绘制一个点
//其中cxt是从canvas中获得的一个2d上下文context
//    x,y分别是该点的横纵坐标
//    color是表示颜色的整形数组，形如[r,g,b]
//    color在这里会本转化为表示颜色的字符串，其内容也可以是：
//        直接用颜色名称:   "red" "green" "blue"
//        十六进制颜色值:   "#EEEEFF"
//        rgb分量表示形式:  "rgb(0-255,0-255,0-255)"
//        rgba分量表示形式:  "rgba(0-255,1-255,1-255,透明度)"
//由于canvas本身没有绘制单个point的接口，所以我们通过绘制一条短路径替代
const MAXLINES = 768;//最大扫描线数目
const NUMPOINTS = 9;//顶点数目
const NUMPOLYGON = 4;//四边形数目
const ONLYFORCIRCLE = Math.PI * 360;//用于计算圆形边位置的角度被除数
let clickNum = 1000;
let clickedPoint = {x: 0, y: 0};
const COLOR = [vertex_color[polygon[0][0]], vertex_color[polygon[1][0]], vertex_color[polygon[2][0]], vertex_color[polygon[3][0]]];//四个四边形颜色
let points = [];
for (let i = 0; i < NUMPOINTS; i++) {
    let point = {};
    point.x = vertex_pos[i][0];
    point.y = vertex_pos[i][1];
    points.push(point);
}

function noRepeatSort(arr) {
    if (arr instanceof Array){
        arr.sort(function (obj1, obj2) {
            return obj1.x - obj2.x;
        });
        let array = [];
        for (let i = 0; i < arr.length; i++) {
            if (array .indexOf(arr[i].x) === -1) {
                array .push(arr[i]);
            }
        }
        return array;
    }
    console.log("类型错误");
    return null;
}
function initEdge(point0, point1) {
    let edge = {};
    edge.point0 = point0;
    edge.point1 = point1;
    if (point0 instanceof Object && point1 instanceof Object) {
        edge.ymax = Math.max(point0.y, point1.y);
        edge.ymin = Math.min(point0.y, point1.y);
        edge.xmin = Math.min(point0.x, point1.x);
        if (edge.ymin === edge.ymax) edge.dx = null;
        else edge.dx = (point0.x - point1.x) / (point0.y - point1.y);
    }
    return edge;
}

function edgePointX(edge, y) {
    if (edge.point0 instanceof Object && edge.dx !== null) {
        return edge.point0.x - (edge.point0.y - y) * edge.dx;
    } else return 0;
}

function initNETObject(edge) {
    let objectNET = {};
    objectNET.edge = edge;
    objectNET.ymax = edge.ymax;
    objectNET.xmin = edge.xmin;
    objectNET.color = edge.color;
    objectNET.dx = edge.dx;
    return objectNET;
}

function initAETObject(ymax, x, dx) {
    let objectAET = {};
    objectAET.ymax = ymax;
    objectAET.x = x;
    objectAET.dx = dx;
    return objectAET;
}


function drawCircle(x, y) {
    //这里由于只是画一个圆形拖框，所以固定大小吧
    // 半径设为10吧
    drawLine(cxt, x, y, x + 10, y, [255, 0, 0]);
    for (let i = 1; i <= 180; i++) {
        let x00 = x + 10 * Math.cos(ONLYFORCIRCLE / i);
        let y00 = y + 10 * Math.sin(ONLYFORCIRCLE / i);
        drawLine(cxt, x, y, x00, y00, [255, 0, 0]);
    }
}


function drawPoint(cxt, x, y, color) {
    //建立一条新的路径
    cxt.beginPath();
    //设置画笔的颜色
    cxt.strokeStyle = "rgb(" + color[0] + "," +
        +color[1] + "," +
        +color[2] + ")";
    //设置路径起始位置
    cxt.moveTo(x, y);
    //在路径中添加一个节点
    cxt.lineTo(x + 1, y + 1);
    //用画笔颜色绘制路径
    cxt.stroke();
}

//绘制线段的函数绘制一条从(x1,y1)到(x2,y2)的线段，cxt和color两个参数意义与绘制点的函数相同，
function drawLine(cxt, x1, y1, x2, y2, color) {

    cxt.beginPath();
    cxt.strokeStyle = "rgba(" + color[0] + "," +
        +color[1] + "," +
        +color[2] + "," +
        +255 + ")";
    //这里线宽取1会有色差，但是类似半透明的效果有利于debug，取2效果较好
    cxt.lineWidth = 1;
    cxt.moveTo(x1, y1);
    cxt.lineTo(x2, y2);
    cxt.stroke();
}

function init() {
    for (let i = 0; i < NUMPOLYGON; i++)
        scanConversion(i);
}


function getPosition(mouseEvent, canvas) {
    let x, y;
    if (mouseEvent.pageX !== undefined && mouseEvent.pageY !== undefined) {
        x = mouseEvent.pageX;
        y = mouseEvent.pageY;
    } else {
        x = canvas.offsetLeft;
        y = canvas.offsetTop;
    }

    return {x: x - canvas.offsetLeft, y: y - canvas.offsetTop};
}

function getDistance(point0, point1) {
    let distance = 1000;
    if (point0 instanceof Object && point1 instanceof Object) {
        let dx = point1.x - point0.x, dy = point1.y - point0.y;
        distance = dx * dx + dy * dy;
    }
    return distance <= 100 ? 1 : -1;
}

//创建鼠标事件的响应
function press(e) {
    clickedPoint = getPosition(e, c);
    for (let i = 0; i < NUMPOINTS; i++) {
        if (getDistance(points[i], clickedPoint) > 0) {
            console.log(1);
            clickNum = i;
            return;
        }
    }
    clickNum = 1000;
}

function up(e) {
    clickNum = 1000;
}

function move(e) {
    if (clickNum < NUMPOINTS) {
        let location = getPosition(e, c);
        //这里稍微克制一下，控制点在距离边界10px外以正常显示（可以移动之后）
        if (location.x >= 10 && location.x <= canvasSize.maxX - 10 && location.y >= 10 && location.y <= canvasSize.maxY - 10) {
            let newPoint = {};
            newPoint.x = location.x - clickedPoint.x + points[clickNum].x;
            newPoint.y = location.y - clickedPoint.y + points[clickNum].y;
            points[clickNum] = newPoint;
            clickedPoint = location;
        }
        c.height = c.height;
        // cxt.clearRect(0, 0, canvasSize.maxX, canvasSize.maxY);
        for (let i = 0; i < NUMPOLYGON; i++) {
            scanConversion(i);
        }
    }
}


function scanConversion(index) {
    //初始化四条边
    let edges = [];
    let polygoni = polygon[index];
    edges.push(initEdge(points[polygoni[0]], points[polygoni[1]]));
    edges.push(initEdge(points[polygoni[1]], points[polygoni[2]]));
    edges.push(initEdge(points[polygoni[2]], points[polygoni[3]]));
    edges.push(initEdge(points[polygoni[3]], points[polygoni[0]]));
    //表结构
    let NET = new Array(MAXLINES);
    let AET = new Array(MAXLINES);
    for (let i = 0; i < MAXLINES; i++) {
        NET[i] = [];
        AET[i] = [];
    }
    for (let i = 0; i < edges.length; i++) {
        NET[edges[i].ymin].push(initNETObject(edges[i]));
    }
    for (let i = 0; i < MAXLINES; i++) {
        if (NET[i].length !== 0) {
            for (let j = 0; j < NET[i].length; j++) {
                let dx = NET[i][j].dx, ymax = NET[i][j].ymax;
                let initX = edgePointX(NET[i][j].edge, i);
                if (dx !== null) {
                    for (let k = i; k <= NET[i][j].ymax; k++) {
                        AET[k].push(initAETObject(ymax, initX + (k - i) * dx, dx));
                    }
                }
            }
        }
    }
    // //绘制颜色区域
    for (let i = 0; i < MAXLINES; i++) {
        if (AET[i].length >= 2) {
            if (AET[i].length===3) console.log(3);
            AET[i].sort(function (obj1, obj2) {
                return obj1.x - obj2.x;
            });
            for (let j = 0; j < AET[i].length-1; j +=2) {
                if (AET[i][j].x!==AET[i][j+1].x)
                drawLine(cxt, AET[i][j].x, i, AET[i][j + 1].x, i, COLOR[index]);
                else {
                    //一个对点处理的丑陋的方法，有心情再改改吧，现在只想咸鱼，，
                    console.log("第"+i+"行"+"第"+j+"个点的x坐标为"+AET[i][j].x+"   "+AET[i][j].x);
                    if (AET[i].length===3) {
                        drawLine(cxt, AET[i][j].x, i, AET[i][j + 2].x, i, COLOR[index]);
                        j++;
                    }
                }
            }
        }
    }

    //创建拖动按钮
    for (let i = 0; i < NUMPOINTS; i++)
        drawCircle(points[i].x, points[i].y);
}

let c = document.getElementById("myCanvas");
let cxt = c.getContext("2d");
//将canvas坐标整体偏移0.5，用于解决宽度为1个像素的线段的绘制问题，具体原理详见project文档
cxt.translate(0.5, 0.5);
c.height = canvasSize.maxY;
c.width = canvasSize.maxX;
init();
document.addEventListener("mousedown", press);
document.addEventListener("mouseup", up);
document.addEventListener("mousemove", move);
