package com.patterns2learn.box.proxy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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

    /** Wraps any Scoreboard in a proxy that logs begin/commit/rollback around each call. */
    static Scoreboard transactional(Scoreboard real, List<String> log) {
        // @step:proxy-factory
        ProxyFactory factory = new ProxyFactory(real);
        factory.addAdvice((MethodInterceptor) call -> {
            log.add("begin");                 // open the transaction
            try {
                Object result = call.proceed(); // the real object does its job
                log.add("commit");
                return result;
            } catch (RuntimeException e) {
                log.add("rollback");            // undo, then let the error through
                throw e;
            }
        });
        return (Scoreboard) factory.getProxy();
        // @end
    }

    @Test void proxyFactoryWrapsAnyObjectWithExtraBehaviour() {
        List<String> log = new ArrayList<>();
        Scoreboard proxy = transactional(wod -> "Ana", log);

        assertThat(proxy.leader("Fran")).isEqualTo("Ana");
        assertThat(log).containsExactly("begin", "commit");
        assertThat(AopUtils.isJdkDynamicProxy(proxy)).isTrue(); // ProxyFactory + an interface: a JDK dynamic proxy
    }

    @Test void anExceptionRollsBack() {
        List<String> log = new ArrayList<>();
        Scoreboard proxy = transactional(wod -> { throw new IllegalStateException("no scores yet"); }, log);

        assertThatThrownBy(() -> proxy.leader("Fran")).isInstanceOf(IllegalStateException.class);
        assertThat(log).containsExactly("begin", "rollback");
    }
}
