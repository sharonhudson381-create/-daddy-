module.exports = async function (req, res) {
    // 从已解析好的请求体中取出对话数据，设置默认空数组防止变量不存在
    const { messages = [] } = req.body;

    // 第44行原校验逻辑，现在messages已正常定义
    if (!Array.isArray(messages) || messages.length === 0) {
        res.writeHead(400, {
            "Content-Type": "application/json;charset=utf-8"
        });
        return res.end(JSON.stringify({
            code: 400,
            msg: "对话消息不能为空，请输入内容"
        }));
    }

    // 读取环境变量
    const API_KEY = process.env.API_KEY;
    const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
    const MODEL_ID = process.env.MODEL_ID || "claude-3-sonnet-20240229";

    // 密钥缺失校验
    if (!API_KEY) {
        res.writeHead(500, {
            "Content-Type": "application/json;charset=utf-8"
        });
        return res.end(JSON.stringify({
            code: 500,
            msg: "服务端未配置大模型接口密钥"
        }));
    }

    // ==========下方粘贴你原本对接 Claude 的请求逻辑即可==========
    /*
    示例占位，替换成你原有业务代码：
    try {
        const resp = await fetch('接口地址', {
            method: 'POST',
            headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages
            })
        });
        const result = await resp.json();
        res.writeHead(200, { "Content-Type": "application/json;charset=utf-8" });
        res.end(JSON.stringify(result));
    } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json;charset=utf-8" });
        res.end(JSON.stringify({ code:500, msg:"接口请求异常："+err.message }));
    }
    */
}
