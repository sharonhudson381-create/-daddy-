process.on('uncaughtException', (err) => {
    console.error('全局未捕获致命异常：', err);
});
process.on('unhandledRejection', (reason) => {
    console.error('未处理的Promise异步异常：', reason);
});
module.exports = async function (req, res) {
    try {
        // 解析请求体
        const { messages = [], password } = req.body;

        // 1.基础参数校验
        if (!Array.isArray(messages) || messages.length === 0) {
            res.writeHead(400, {
                "Content-Type": "application/json;charset=utf-8"
            });
            return res.end(JSON.stringify({
                code: 400,
                msg: "对话内容不能为空"
            }));
        }

        // 读取环境变量
        const API_KEY = process.env.API_KEY;
        const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;
        const MODEL_ID = process.env.MODEL_ID || "claude-3-sonnet-20240229";

        // 2.校验后台密钥是否配置
        if (!API_KEY) {
            res.writeHead(500, {
                "Content-Type": "application/json;charset=utf-8"
            });
            return res.end(JSON.stringify({
                code: 500,
                msg: "服务端未配置Claude接口密钥"
            }));
        }

        // 3.前端访问密码校验（按需开启）
        if (ACCESS_PASSWORD && password !== ACCESS_PASSWORD) {
            res.writeHead(403, {
                "Content-Type": "application/json;charset=utf-8"
            });
            return res.end(JSON.stringify({
                code: 403,
                msg: "访问密码错误"
            }));
        }

        // ======================
        // 此处放入你原本调用 Claude 的请求代码
        // ======================
        /*
        const fetchRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: MODEL_ID,
                messages,
                max_tokens: 1024
            })
        });

        const result = await fetchRes.json();
        if (!fetchRes.ok) throw new Error(JSON.stringify(result));

        res.writeHead(200, {
            "Content-Type": "application/json;charset=utf-8"
        });
        return res.end(JSON.stringify(result));
        */

        // 临时测试占位：直接返回测试回复，先验证接口通不通
        res.writeHead(200, {
            "Content-Type": "application/json;charset=utf-8"
        });
        return res.end(JSON.stringify({
            content: "接口连通测试成功，后端无报错"
        }));

    } catch (err) {
        // 捕获所有异常，不会直接抛出500崩溃
        console.error("chat接口执行异常：", err);
        res.writeHead(500, {
            "Content-Type": "application/json;charset=utf-8"
        });
        return res.end(JSON.stringify({
            code: 500,
            msg: "服务内部异常：" + err.message
        }));
    }
};
