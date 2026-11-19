package com.patterns2learn.box.proxy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.aopalliance.intercept.MethodInterceptor;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.ProxyFactory;
import org.springframework.aop.support.AopUtils;

class SpringDoesItTooTest {
    interface Scoreboard {
        String leader(String wod);
    }

    @Test void proxyFactoryWrapsAnyObjectWithExtraBehaviour() {
        List<String> log = new ArrayList<>();
        Scoreboard real = wod -> "Ana";

        // @step:proxy-factory
        ProxyFactory factory = new ProxyFactory(real);
        factory.addAdvice((MethodInterceptor) call -> {
            log.add("before " + call.getMethod().getName()); // e.g. begin transaction
            Object result = call.proceed();                   // the real object does its job
            log.add("after " + call.getMethod().getName());  // e.g. commit
            return result;
        });
        Scoreboard proxy = (Scoreboard) factory.getProxy();

        assertThat(proxy.leader("Fran")).isEqualTo("Ana");
        assertThat(log).containsExactly("before leader", "after leader");
        assertThat(AopUtils.isJdkDynamicProxy(proxy)).isTrue(); // an interface: a JDK dynamic proxy
        // @end
    }
}
