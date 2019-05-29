require("../css/index.css");
require('mdui/dist/css/mdui.min.css');
const mdui = require('mdui/dist/js/mdui.min.js')
import T from '../utils/index.js';
import Chat from './chat.js'
import DrawBoard from './drawBoard.js'

const userInfo = {};
window.onload = function () {
	//其它事件
	let showPanel = false;
	//画布对象和上下文
	let canvas = T.getEle("#canvas");
	let ctx = canvas.getContext("2d");

	//协作设置

	userInfo.username = prompt("输入用户名，不输入则随机命名") || `用户${new Date().getTime()}`;
	sessionStorage.setItem("drawusername", userInfo.username);
	T.getEle('.userNameTag').innerHTML = userInfo.username;

	let msgBox = T.getEle('.msgBox');
	let msgInput = T.getEle('.msgTxt');
	let genChatTpl = (name = 'unkonw', content = 'unkonw') => {
		return `
			<div>
				<span>${name}说:&nbsp;&nbsp;${content}</span><br>
			</div> 
			`
	};
	//实例化聊天对象
	let chat = new Chat({
		receive: [{
				socketName: 'getChatData',
				callback: res => {
					if (res) {
						try {
							res = JSON.parse(res)
							msgBox.innerHTML += genChatTpl(res.username, res.msg);
						} catch (e) {
							console.error('返回数据有误');
						}
					}
				}
			},
			{
				socketName: 'updateUserList',
				callback: res => {
					try {
						res = JSON.parse(res);
						T.getEle('.wrapUserList').innerHTML = '';
						res.forEach(item => {
							T.getEle('.wrapUserList').innerHTML += `
							<div class="mdui-chip">
								<span class="mdui-chip-icon ${item.data == userInfo.username ? 'mdui-color-yellow': 'mdui-color-black'}">${item.data.substring(0,1)}</span>
								<span class="mdui-chip-title mdui-text-truncate" style="max-width: 95px;">${item.data}</span>
							</div>
							`;
						})
					} catch (error) {
						console.error("数据格式出错");
					}
				}
			},
			{
				socketName: 'resetBeginPath',
				callback: res => {
					try {
						res = JSON.parse(res);
						if (res.status && res.username != userInfo.username) {
								ctx.beginPath();
						}
					} catch (error) {
						console.log(error);
					}
				}
			}
		]
	});
	//实例化画板
	const db = new DrawBoard({
		canvas,
		ctx,
		penceilWeight,
		winW: T.getTargetWH()[0],
		winH: T.getTargetWH()[1]
	}, chat.getSocket());
	//配置重置
	chat.getSocket().on('resetConfig', res=>{
		try {
		res = JSON.parse(res);
			console.log(res)
			if (res.username != userInfo.username) {
				res.config.travel !=0 ? db.travel(res.config.travel) : false;
				res.config.clearCanvas ? db.clearCanvas() : false;
				res.config.penceilWeight ? db.updateCtxStyle({penceilWeight: res.config.penceilWeight}) : false;
				res.config.penceilColor ? db.updateCtxStyle({penceilColor: res.config.penceilColor}) : false;
				res.config.canvasColor ? db.updateCtxStyle({canvasColor:res.config.canvasColor}): false;
			}
		} catch (error) {
			console.log(error);
		}
	});
	//封装发送配置信息
	
	//相关事件监听//需要同步事件
	T.getEle("#backward").onclick = () => {
		db.travel(-1)
		chat.sendData('syncConfig',JSON.stringify({username:userInfo.username, config:{travel:-1}}));
	};
	T.getEle("#forward").onclick = () => {
		db.travel(1)
		chat.sendData('syncConfig',JSON.stringify({username:userInfo.username, config:{travel:1}}));
	};
	
	T.getEle("#clearAll").onclick = () => {
		db.clearCanvas();
		chat.sendData('syncConfig',JSON.stringify({username:userInfo.username, config:{clearCanvas:true}}));
	}
	T.getEle("#penceilWeight").onchange = function () {
		this.value = this.value > 120 ? 120 : this.value;
		this.value = this.value < 1 ? 1 : this.value;
		db.updateCtxStyle({penceilWeight: this.value});
		chat.sendData('syncConfig',JSON.stringify({username:userInfo.username, config:{penceilWeight:this.value}}));
	}
	T.getEle("#penceilColor").onchange = function () {
		db.updateCtxStyle({	penceilColor: this.value});
		chat.sendData('syncConfig',JSON.stringify({username:userInfo.username, config:{penceilColor:this.value}}));
	}
	T.getEle("#canvasColor").onchange = function () {
		db.updateCtxStyle({canvasColor: this.value	});
		chat.sendData('syncConfig',JSON.stringify({username:userInfo.username, config:{canvasColor:this.value}}));
	}
	let scaleNum = T.getEle("#scaleNum");
	T.getEle("#larger").onclick = () => {
		db.scaleHandler(scaleNum, true);
	};
	T.getEle("#smaller").onclick = () => {
		db.scaleHandler(scaleNum, false);
	};

	//发送聊天消息
	T.getEle('.sendBtn').onclick = function () {
		if(msgInput.value.replace(/ /img, '') == ""){
			mdui.snackbar({
				message: '不要发送空消息',
				position: 'top'
			});
			return;
		}
		chat.sendData('chatData', JSON.stringify({
			"username": userInfo.username,
			"msg": msgInput.value
		}), res => {
			if (res) {
				msgInput.value = '';
			} else {
				alert("发送消息中断");
			}
		});
	};
	//添加用户
	chat.sendData('addUser', userInfo.username);
	//弹出聊天界面事件绑定
	var tab = new mdui.Tab('#example4-tab');
  document.getElementById('example-4').addEventListener('open.mdui.dialog', function () {
    tab.handleUpdate();
  });
};